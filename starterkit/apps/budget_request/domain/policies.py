from django.contrib.auth.models import AbstractBaseUser, AnonymousUser

UserLike = AbstractBaseUser | AnonymousUser


def _in_role(actor: UserLike, role: str) -> bool:
    return bool(
        getattr(actor, "is_authenticated", False)
        and getattr(actor, "is_active", False)
        and actor.groups.filter(name=role).exists()
    )


def get_role(actor: UserLike) -> str | None:
    if not getattr(actor, "is_authenticated", False):
        return None
    if getattr(actor, "is_superuser", False) or _in_role(actor, "Admin"):
        return "Admin"
    if _in_role(actor, "Manager"):
        return "Manager"
    if _in_role(actor, "Client"):
        return "Client"
    return None


def is_client(actor: UserLike) -> bool:
    return get_role(actor) == "Client"


def is_manager(actor: UserLike) -> bool:
    return get_role(actor) == "Manager"


def is_admin(actor: UserLike) -> bool:
    return get_role(actor) == "Admin"


def can_create_budget_request(actor: UserLike) -> bool:
    return is_client(actor)


def can_view_budget_request(actor: UserLike, budget_request) -> bool:
    if is_admin(actor) or is_manager(actor):
        return True
    return is_client(actor) and budget_request.requesting_user_id == actor.pk


def can_edit_budget_request(actor: UserLike, budget_request) -> bool:
    return bool(
        is_client(actor)
        and budget_request.requesting_user_id == actor.pk
        and budget_request.status == "PENDING"
    )


def can_withdraw_budget_request(actor: UserLike, budget_request) -> bool:
    return can_edit_budget_request(actor, budget_request)


def can_review_budget_request(actor: UserLike, budget_request) -> bool:
    return bool(is_manager(actor) and budget_request.status == "PENDING")


def can_delete_budget_request(actor: UserLike, budget_request=None) -> bool:
    return is_admin(actor)