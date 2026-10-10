from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User, Role
from .models import (
    CandidateProfile,
    AccessibilityProfile,
    DisabilityType,
    DifficultyLevel,
)
from .services import get_or_create_candidate_profile, calculate_completion_percentage


class CandidateProfileTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Candidate A
        self.candidate_a = User.objects.create_user(
            email='alice@example.com',
            full_name='Alice Candidate',
            password='Password123!',
            role=Role.CANDIDATE,
        )
        self.profile_a = get_or_create_candidate_profile(self.candidate_a)
        # Give Candidate A a UDID and disability record
        self.profile_a.accessibility_profile.primary_disability = DisabilityType.LOCOMOTOR
        self.profile_a.accessibility_profile.udid_number = 'DL12345678901234'
        self.profile_a.accessibility_profile.save()

        # Candidate B
        self.candidate_b = User.objects.create_user(
            email='bob@example.com',
            full_name='Bob Candidate',
            password='Password123!',
            role=Role.CANDIDATE,
        )
        self.profile_b = get_or_create_candidate_profile(self.candidate_b)

        # Job Coach
        self.coach = User.objects.create_user(
            email='coach@example.com',
            full_name='Coach Priya',
            password='Password123!',
            role=Role.COACH,
        )

    def test_candidate_can_read_and_update_own_profile(self):
        """Alice can retrieve her own profile and see her UDID."""
        self.client.force_authenticate(user=self.candidate_a)
        response = self.client.get(reverse('profile-me'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['email'], 'alice@example.com')
        # Owner CAN view their own UDID
        self.assertEqual(
            response.data['accessibility_profile']['udid_number'],
            'DL12345678901234'
        )

        # Alice updates her city and state
        update_data = {
            'city': 'New Delhi',
            'state': 'Delhi',
            'gender': 'female',
            'date_of_birth': '2000-01-15',
        }
        put_response = self.client.put(reverse('profile-me'), update_data)
        self.assertEqual(put_response.status_code, status.HTTP_200_OK)
        self.assertEqual(put_response.data['city'], 'New Delhi')
        # Completion percentage increases
        self.assertGreater(put_response.data['completion_percentage'], 10)

    def test_candidate_cannot_read_another_candidates_profile(self):
        """CRITICAL SECURITY TEST: Bob cannot view Alice's private profile."""
        self.client.force_authenticate(user=self.candidate_b)
        url = reverse('profile-detail', kwargs={'pk': self.profile_a.id})
        response = self.client.get(url)
        # Must return 403 Forbidden
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_udid_privacy_guard_never_leaks_udid_to_non_owners(self):
        """Even when an authorized staff/coach views a profile, UDID is masked/hidden."""
        self.client.force_authenticate(user=self.coach)
        url = reverse('profile-detail', kwargs={'pk': self.profile_a.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Coach can see candidate's details for guidance...
        self.assertEqual(response.data['user']['full_name'], 'Alice Candidate')
        # ... BUT UDID number is stripped and returned as None for privacy!
        self.assertIsNone(response.data['accessibility_profile']['udid_number'])

    def test_accessibility_profile_update(self):
        """Candidate can update functional difficulties and accommodation needs."""
        self.client.force_authenticate(user=self.candidate_a)
        data = {
            'primary_disability': DisabilityType.INTELLECTUAL,
            'difficulty_remembering_concentrating': DifficultyLevel.SOME,
            'needs_extra_time_for_exams': True,
            'needs_scribe': True,
            'assistive_devices_required': ['Screen reader software', 'Large key keyboard'],
        }
        response = self.client.put(reverse('profile-accessibility'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['primary_disability'], DisabilityType.INTELLECTUAL)
        self.assertTrue(response.data['needs_scribe'])
        self.assertTrue(response.data['needs_extra_time_for_exams'])
        self.assertIn('Screen reader software', response.data['assistive_devices_required'])

    def test_education_crud_and_completion_percentage(self):
        """Adding education increases completion percentage."""
        self.client.force_authenticate(user=self.candidate_a)
        edu_data = {
            'qualification': 'Bachelor of Computer Applications',
            'institution': 'Delhi University',
            'year_of_passing': 2023,
            'percentage_or_cgpa': '8.2 CGPA',
        }
        res = self.client.post(reverse('profile-education-list-create'), edu_data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        # Check me endpoint shows education and higher completion score
        me_res = self.client.get(reverse('profile-me'))
        self.assertEqual(len(me_res.data['educations']), 1)
        self.assertGreaterEqual(me_res.data['completion_percentage'], 30)

    def test_skills_crud(self):
        """Candidate can add and remove skills."""
        self.client.force_authenticate(user=self.candidate_a)
        skill_data = {
            'name': 'Python Programming',
            'category': 'technical',
            'proficiency': 'intermediate',
        }
        res = self.client.post(reverse('profile-skill-list-create'), skill_data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        skill_id = res.data['id']

        # Delete skill
        del_res = self.client.delete(reverse('profile-skill-detail', kwargs={'pk': skill_id}))
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)


class CandidateDocumentTests(TestCase):
    def setUp(self):
        import io, zipfile
        self.client = APIClient()

        # Users
        self.candidate_a = User.objects.create_user(
            email='doc_alice@example.com',
            full_name='Alice Doc',
            password='Password123!',
            role=Role.CANDIDATE,
        )
        self.profile_a = get_or_create_candidate_profile(self.candidate_a)

        self.candidate_b = User.objects.create_user(
            email='doc_bob@example.com',
            full_name='Bob Doc',
            password='Password123!',
            role=Role.CANDIDATE,
        )
        self.profile_b = get_or_create_candidate_profile(self.candidate_b)

        self.assigned_coach = User.objects.create_user(
            email='assigned_coach@example.com',
            full_name='Assigned Coach',
            password='Password123!',
            role=Role.COACH,
        )
        from support.models import JobCoachAssignment, GuardianAccess
        JobCoachAssignment.objects.create(
            candidate=self.profile_a,
            coach=self.assigned_coach,
            is_active=True,
        )

        self.unassigned_coach = User.objects.create_user(
            email='unassigned_coach@example.com',
            full_name='Unassigned Coach',
            password='Password123!',
            role=Role.COACH,
        )

        self.guardian_permitted = User.objects.create_user(
            email='guardian_permitted@example.com',
            full_name='Guardian Permitted',
            password='Password123!',
            role=Role.GUARDIAN,
        )
        GuardianAccess.objects.create(
            candidate=self.profile_a,
            guardian=self.guardian_permitted,
            allow_view_documents=True,
        )

        self.guardian_restricted = User.objects.create_user(
            email='guardian_restricted@example.com',
            full_name='Guardian Restricted',
            password='Password123!',
            role=Role.GUARDIAN,
        )
        GuardianAccess.objects.create(
            candidate=self.profile_a,
            guardian=self.guardian_restricted,
            allow_view_documents=False,
        )

        self.admin = User.objects.create_user(
            email='admin_user@example.com',
            full_name='Admin User',
            password='Password123!',
            role=Role.ADMIN,
        )

    def _create_dummy_pdf(self, name='test_resume.pdf', size_extra=0):
        content = b'%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF' + (b'X' * size_extra)
        from django.core.files.uploadedfile import SimpleUploadedFile
        return SimpleUploadedFile(name, content, content_type='application/pdf')

    def _create_dummy_docx(self, name='test_doc.docx'):
        import io, zipfile
        from django.core.files.uploadedfile import SimpleUploadedFile
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, 'w') as zf:
            zf.writestr('[Content_Types].xml', '<Types/>')
            zf.writestr('word/document.xml', '<w:document><w:body/></w:document>')
        return SimpleUploadedFile(name, buf.getvalue(), content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document')

    def test_upload_valid_pdf_success(self):
        """Alice can upload a valid PDF resume."""
        self.client.force_authenticate(user=self.candidate_a)
        pdf_file = self._create_dummy_pdf()
        response = self.client.post(
            reverse('profile-document-list-create'),
            {'file': pdf_file, 'document_type': 'resume'},
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['original_filename'], 'test_resume.pdf')
        self.assertEqual(response.data['document_type'], 'resume')
        self.assertEqual(response.data['content_type'], 'application/pdf')

    def test_upload_valid_docx_success(self):
        """Alice can upload a valid DOCX document."""
        self.client.force_authenticate(user=self.candidate_a)
        docx_file = self._create_dummy_docx()
        response = self.client.post(
            reverse('profile-document-list-create'),
            {'file': docx_file, 'document_type': 'certificate'},
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['content_type'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')

    def test_upload_wrong_file_type_fails(self):
        """Uploading executable or text file is rejected with 400."""
        self.client.force_authenticate(user=self.candidate_a)
        from django.core.files.uploadedfile import SimpleUploadedFile
        exe_file = SimpleUploadedFile('malware.exe', b'MZ\x90\x00\x03\x00', content_type='application/octet-stream')
        response = self.client.post(
            reverse('profile-document-list-create'),
            {'file': exe_file, 'document_type': 'resume'},
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('not supported', str(response.data))

    def test_upload_fake_extension_fails_magic_bytes_check(self):
        """Uploading plain text disguised as a .pdf is rejected by magic byte inspection."""
        self.client.force_authenticate(user=self.candidate_a)
        from django.core.files.uploadedfile import SimpleUploadedFile
        fake_pdf = SimpleUploadedFile('fake.pdf', b'Hello plain text file masquerading as PDF', content_type='application/pdf')
        response = self.client.post(
            reverse('profile-document-list-create'),
            {'file': fake_pdf, 'document_type': 'resume'},
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('does not match the PDF format', str(response.data))

    def test_upload_oversized_file_fails(self):
        """File larger than 5 MB is rejected."""
        self.client.force_authenticate(user=self.candidate_a)
        # 5 MB + 100 bytes
        oversized_pdf = self._create_dummy_pdf(size_extra=5 * 1024 * 1024 + 100)
        response = self.client.post(
            reverse('profile-document-list-create'),
            {'file': oversized_pdf, 'document_type': 'resume'},
            format='multipart',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('exceeds the maximum allowed limit', str(response.data))

    def test_upload_quota_limit(self):
        """Candidate cannot exceed 10 documents."""
        self.client.force_authenticate(user=self.candidate_a)
        for i in range(10):
            pdf_file = self._create_dummy_pdf(name=f'doc_{i}.pdf')
            res = self.client.post(
                reverse('profile-document-list-create'),
                {'file': pdf_file, 'document_type': 'other'},
                format='multipart',
            )
            self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        # 11th document upload fails
        extra_pdf = self._create_dummy_pdf(name='doc_11.pdf')
        res11 = self.client.post(
            reverse('profile-document-list-create'),
            {'file': extra_pdf, 'document_type': 'other'},
            format='multipart',
        )
        self.assertEqual(res11.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('maximum quota', str(res11.data))

    def test_owner_access_and_download(self):
        """Owner can generate signed download URL and stream document."""
        self.client.force_authenticate(user=self.candidate_a)
        pdf = self._create_dummy_pdf()
        up_res = self.client.post(
            reverse('profile-document-list-create'),
            {'file': pdf, 'document_type': 'resume'},
            format='multipart',
        )
        doc_id = up_res.data['id']

        # Request download URL
        dl_res = self.client.get(reverse('profile-document-download', kwargs={'pk': doc_id}))
        self.assertEqual(dl_res.status_code, status.HTTP_200_OK)
        self.assertIn('download_url', dl_res.data)

        # Follow local streaming download URL
        stream_url = dl_res.data['download_url']
        stream_res = self.client.get(stream_url)
        self.assertEqual(stream_res.status_code, status.HTTP_200_OK)
        self.assertTrue(b'%PDF-1.4' in b''.join(stream_res.streaming_content))

    def test_other_candidate_gets_403(self):
        """Candidate B cannot download Candidate A's document."""
        self.client.force_authenticate(user=self.candidate_a)
        pdf = self._create_dummy_pdf()
        up_res = self.client.post(
            reverse('profile-document-list-create'),
            {'file': pdf, 'document_type': 'resume'},
            format='multipart',
        )
        doc_id = up_res.data['id']

        # Bob attempts download
        self.client.force_authenticate(user=self.candidate_b)
        dl_res = self.client.get(reverse('profile-document-download', kwargs={'pk': doc_id}))
        self.assertEqual(dl_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_coach_without_assignment_gets_403(self):
        """Unassigned coach is forbidden from downloading Alice's document."""
        self.client.force_authenticate(user=self.candidate_a)
        pdf = self._create_dummy_pdf()
        up_res = self.client.post(
            reverse('profile-document-list-create'),
            {'file': pdf, 'document_type': 'resume'},
            format='multipart',
        )
        doc_id = up_res.data['id']

        # Unassigned coach attempts download
        self.client.force_authenticate(user=self.unassigned_coach)
        dl_res = self.client.get(reverse('profile-document-download', kwargs={'pk': doc_id}))
        self.assertEqual(dl_res.status_code, status.HTTP_403_FORBIDDEN)

    def test_coach_with_assignment_can_download_and_audit_logged(self):
        """Assigned coach can download document and an audit entry is created."""
        self.client.force_authenticate(user=self.candidate_a)
        pdf = self._create_dummy_pdf()
        up_res = self.client.post(
            reverse('profile-document-list-create'),
            {'file': pdf, 'document_type': 'resume'},
            format='multipart',
        )
        doc_id = up_res.data['id']

        # Assigned coach downloads
        self.client.force_authenticate(user=self.assigned_coach)
        dl_res = self.client.get(reverse('profile-document-download', kwargs={'pk': doc_id}))
        self.assertEqual(dl_res.status_code, status.HTTP_200_OK)

        # Audit log verification
        from admin_panel.models import AdminAuditLog
        log = AdminAuditLog.objects.filter(target_id=str(doc_id), action_type='DOCUMENT_DOWNLOAD').first()
        self.assertIsNotNone(log)
        self.assertIn('Assigned Coach', log.details)

    def test_guardian_permissions(self):
        """Guardian with allow_view_documents can download; guardian without is denied."""
        self.client.force_authenticate(user=self.candidate_a)
        pdf = self._create_dummy_pdf()
        up_res = self.client.post(
            reverse('profile-document-list-create'),
            {'file': pdf, 'document_type': 'certificate'},
            format='multipart',
        )
        doc_id = up_res.data['id']

        # Restricted guardian -> 403
        self.client.force_authenticate(user=self.guardian_restricted)
        res_denied = self.client.get(reverse('profile-document-download', kwargs={'pk': doc_id}))
        self.assertEqual(res_denied.status_code, status.HTTP_403_FORBIDDEN)

        # Permitted guardian -> 200
        self.client.force_authenticate(user=self.guardian_permitted)
        res_allowed = self.client.get(reverse('profile-document-download', kwargs={'pk': doc_id}))
        self.assertEqual(res_allowed.status_code, status.HTTP_200_OK)

    def test_deletion_removes_db_record_and_file(self):
        """Deleting a document removes the database row and physical storage file."""
        self.client.force_authenticate(user=self.candidate_a)
        pdf = self._create_dummy_pdf(name='to_delete.pdf')
        up_res = self.client.post(
            reverse('profile-document-list-create'),
            {'file': pdf, 'document_type': 'other'},
            format='multipart',
        )
        doc_id = up_res.data['id']

        from .models import CandidateDocument
        doc = CandidateDocument.objects.get(pk=doc_id)
        from .storage import document_storage
        file_path = document_storage.get_local_file_path(doc.stored_key)
        self.assertTrue(file_path.exists())

        # Delete document
        del_res = self.client.delete(reverse('profile-document-detail', kwargs={'pk': doc_id}))
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)

        # Verify DB row is gone
        self.assertFalse(CandidateDocument.objects.filter(pk=doc_id).exists())

        # Verify physical file is gone
        self.assertFalse(file_path.exists())

