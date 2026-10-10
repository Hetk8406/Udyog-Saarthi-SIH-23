from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import NotFound

from .models import Job, SavedJob, Organization
from .serializers import JobSerializer, SavedJobSerializer, OrganizationSerializer
from .services import filter_jobs
from accounts.permissions import IsAdminRole


class JobPagination(PageNumberPagination):
    page_size = 9
    page_size_query_param = 'page_size'
    max_page_size = 30


class JobListCreateView(APIView):
    """Public listing of jobs with search and filters; Admin-only job creation."""
    pagination_class = JobPagination

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminRole()]
        return [AllowAny()]

    def get(self, request):
        queryset = filter_jobs(request.query_params)
        paginator = self.pagination_class()
        paginated_jobs = paginator.paginate_queryset(queryset, request)
        serializer = JobSerializer(paginated_jobs, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = JobSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            job = serializer.save()
            return Response(
                JobSerializer(job, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class JobDetailView(APIView):
    """Public job view; Admin-only update and delete."""

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAdminRole()]
        return [AllowAny()]

    def get_object(self, pk):
        try:
            return Job.objects.select_related('organization').get(pk=pk)
        except Job.DoesNotExist:
            raise NotFound("Job vacancy not found.")

    def get(self, request, pk):
        job = self.get_object(pk)
        serializer = JobSerializer(job, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        job = self.get_object(pk)
        serializer = JobSerializer(job, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        job = self.get_object(pk)
        job.delete()
        return Response({"message": "Job removed successfully."}, status=status.HTTP_204_NO_CONTENT)


class SaveJobToggleView(APIView):
    """Toggle saving/bookmarking a job for candidate."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            job = Job.objects.get(pk=pk)
        except Job.DoesNotExist:
            raise NotFound("Job vacancy not found.")

        saved_entry = SavedJob.objects.filter(user=request.user, job=job).first()
        if saved_entry:
            saved_entry.delete()
            return Response({"saved": False, "message": "Job removed from saved bookmarks."}, status=status.HTTP_200_OK)
        else:
            SavedJob.objects.create(user=request.user, job=job)
            return Response({"saved": True, "message": "Job successfully bookmarked."}, status=status.HTTP_201_CREATED)


class SavedJobsListView(APIView):
    """List all saved jobs for current logged-in user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        saved = SavedJob.objects.filter(user=request.user).select_related('job', 'job__organization')
        serializer = SavedJobSerializer(saved, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class OrganizationListView(APIView):
    """Public list of participating organizations."""
    permission_classes = [AllowAny]

    def get(self, request):
        orgs = Organization.objects.all()
        serializer = OrganizationSerializer(orgs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
