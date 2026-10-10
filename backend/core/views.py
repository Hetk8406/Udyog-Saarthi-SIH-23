from django.http import JsonResponse
from django.db import connection


def health_check(request):
    """
    Lightweight healthcheck endpoint for container orchestrators and load balancers.
    Returns 200 OK if the web server and database connection are operational.
    Exposes zero sensitive configuration, credential, or version details.
    """
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1;")
            cursor.fetchone()
        db_status = "ok"
    except Exception:
        return JsonResponse(
            {"status": "error", "database": "unavailable"},
            status=503
        )

    return JsonResponse(
        {
            "status": "ok",
            "database": db_status,
        },
        status=200
    )
