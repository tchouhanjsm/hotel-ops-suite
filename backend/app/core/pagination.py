from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class PaginationParams:
    page: int = 1
    page_size: int = 50

    def __post_init__(self) -> None:
        if self.page < 1:
            raise ValueError("Page must be at least 1.")

        if self.page_size < 1 or self.page_size > 100:
            raise ValueError("Page size must be between 1 and 100.")

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size
