from django.db.models import Count, Q, Sum

from apps.budget_request.models.budget_reuqest import BudgetRequest


def get_budget_request_by_id(request_id: int) -> BudgetRequest | None:
    try:
        return BudgetRequest.objects.select_related("requesting_user", "reviewing_user").get(pk=request_id)
    except BudgetRequest.DoesNotExist:
        return None


def get_budget_requests_by_user(user):
    return BudgetRequest.objects.filter(requesting_user=user).select_related("reviewing_user")


def get_pending_budget_requests():
    return BudgetRequest.objects.filter(status=BudgetRequest.Status.PENDING).select_related("requesting_user")


def get_historical_budget_requests():
    return BudgetRequest.objects.exclude(status=BudgetRequest.Status.PENDING).select_related(
        "requesting_user", "reviewing_user"
    )


def get_all_budget_requests():
    return BudgetRequest.objects.select_related("requesting_user", "reviewing_user")


def get_budget_totals():
    totals = BudgetRequest.objects.aggregate(
        pending=Sum("amount", filter=Q(status=BudgetRequest.Status.PENDING)),
        approved=Sum("amount", filter=Q(status=BudgetRequest.Status.APPROVED)),
        rejected=Sum("amount", filter=Q(status=BudgetRequest.Status.REJECTED)),
        total=Sum("amount"),
        count=Count("pk"),
    )
    return {
        "pending": totals["pending"] or 0,
        "approved": totals["approved"] or 0,
        "rejected": totals["rejected"] or 0,
        "total": totals["total"] or 0,
        "count": totals["count"] or 0,
    }


