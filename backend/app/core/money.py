from decimal import ROUND_HALF_UP, Decimal, InvalidOperation

type Money = Decimal

CENT = Decimal("0.01")
ZERO_MONEY = Decimal("0.00")


def to_money(value: Decimal | int | str) -> Money:
    """Convert a supported numeric value to currency precision."""
    try:
        decimal_value = value if isinstance(value, Decimal) else Decimal(str(value))
        return decimal_value.quantize(CENT, rounding=ROUND_HALF_UP)
    except (InvalidOperation, ValueError) as exc:
        raise ValueError("Invalid monetary value.") from exc


def calculate_line_amount(quantity: Decimal, unit_price: Decimal) -> Money:
    return to_money(quantity * unit_price)


def calculate_tax(amount: Decimal, tax_percent: Decimal) -> Money:
    return to_money(amount * tax_percent / Decimal("100"))


def calculate_total(amount: Decimal, tax_amount: Decimal) -> Money:
    return to_money(amount + tax_amount)


def calculate_balance(total: Decimal, paid: Decimal) -> Money:
    return max(
        to_money(total - paid),
        ZERO_MONEY,
    )
