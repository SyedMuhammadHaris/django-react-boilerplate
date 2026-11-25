from urllib.parse import urlsplit

from django.contrib import messages
from django.shortcuts import redirect
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.csrf import csrf_failure as django_csrf_failure
from django.views.defaults import permission_denied as django_permission_denied


def permission_denied(request, exception, template_name="403.html"):
    if request.headers.get("X-Inertia") != "true":
        return django_permission_denied(request, exception, template_name)

    messages.error(request, "You don't have permission to complete that action.")
    return _redirect_to_previous_page(request)


def csrf_failure(request, reason="", template_name="403_csrf.html"):
    if request.headers.get("X-Inertia") != "true":
        return django_csrf_failure(request, reason, template_name)

    messages.error(request, "Your session could not be verified. Please refresh the page and try again.")
    return _redirect_to_previous_page(request)


def _redirect_to_previous_page(request):
    referer = request.META.get("HTTP_REFERER", "")
    if referer and url_has_allowed_host_and_scheme(
        referer,
        allowed_hosts={request.get_host()},
        require_https=request.is_secure(),
    ):
        referer_parts = urlsplit(referer)
        referer_path = referer_parts.path
        if request.method == "POST" or referer_path != request.path:
            destination = referer_path
            if referer_parts.query:
                destination = f"{destination}?{referer_parts.query}"
            if url_has_allowed_host_and_scheme(
                destination,
                allowed_hosts={request.get_host()},
                require_https=request.is_secure(),
            ):
                return redirect(destination)
    return redirect("home")
