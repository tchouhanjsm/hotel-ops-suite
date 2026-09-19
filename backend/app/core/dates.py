from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True, slots=True)
class DateRange:
    start: date
    end: date

    def __post_init__(self) -> None:
        if self.end <= self.start:
            raise ValueError("End date must be after start date.")

    @property
    def nights(self) -> int:
        return (self.end - self.start).days


def validate_date_range(start: date, end: date) -> DateRange:
    return DateRange(start=start, end=end)
