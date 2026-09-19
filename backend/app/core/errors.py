class DomainError(Exception):
    """Base class for business-rule failures."""


class ValidationError(DomainError):
    """Input violates a business rule."""


class NotFoundError(DomainError):
    """Requested domain entity does not exist."""


class ConflictError(DomainError):
    """Requested operation conflicts with current state."""


class StateError(DomainError):
    """Entity is not in a valid state for the requested operation."""


class AuthorizationError(DomainError):
    """Authenticated actor is not allowed to perform an operation."""
