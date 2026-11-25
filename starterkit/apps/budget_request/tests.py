from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.test import TestCase

from apps.budget_request.domain import policies
from apps.budget_request.dto.budget_reuqest import BudgetRequestInputDto, BudgetRequestStatusUpdateDto
from apps.budget_request.models.budget_reuqest import BudgetRequest
from apps.budget_request.selectors.budget_request import get_budget_requests_by_user
from apps.budget_request.services.budget_request import (
    create_budget_request,
    review_budget_request,
    update_budget_request,
)


class BudgetRequestTestCase(TestCase):
    def setUp(self):
        User = get_user_model()
        self.client_user = User.objects.create_user(username="client", password="test")
        self.manager = User.objects.create_user(username="manager", password="test")
        self.admin = User.objects.create_user(username="admin", password="test")
        self.client_user.groups.add(Group.objects.get_or_create(name="Client")[0])
        self.manager.groups.add(Group.objects.get_or_create(name="Manager")[0])
        self.admin.groups.add(Group.objects.get_or_create(name="Admin")[0])

    def test_policy_lifecycle(self):
        request = BudgetRequest.objects.create(
            title="Laptop",
            amount="1200.00",
            business_justification="Development equipment",
            requesting_user=self.client_user,
        )
        self.assertTrue(policies.can_edit_budget_request(self.client_user, request))
        self.assertTrue(policies.can_review_budget_request(self.manager, request))
        request.status = BudgetRequest.Status.APPROVED
        request.save()
        self.assertFalse(policies.can_edit_budget_request(self.client_user, request))
        self.assertFalse(policies.can_review_budget_request(self.manager, request))

    def test_create_update_and_selector(self):
        result = create_budget_request(
            actor=self.client_user,
            data=BudgetRequestInputDto("Conference", "Team training", "500.00"),
        )
        self.assertTrue(result["success"])
        request = BudgetRequest.objects.get(pk=result["budget_request_id"])
        self.assertEqual(list(get_budget_requests_by_user(self.client_user)), [request])

        result = update_budget_request(
            actor=self.client_user,
            budget_request_id=request.pk,
            data=BudgetRequestInputDto("Conference travel", "Updated scope", "650.00"),
        )
        self.assertTrue(result["success"])
        request.refresh_from_db()
        self.assertEqual(request.title, "Conference travel")

    def test_rejection_requires_feedback(self):
        request = BudgetRequest.objects.create(
            title="Printer",
            amount="300.00",
            business_justification="Office replacement",
            requesting_user=self.client_user,
        )
        result = review_budget_request(
            actor=self.manager,
            budget_request_id=request.pk,
            data=BudgetRequestStatusUpdateDto(status="REJECTED", feedback=""),
        )
        self.assertFalse(result["success"])
        self.assertIn("feedback", result["errors"])
