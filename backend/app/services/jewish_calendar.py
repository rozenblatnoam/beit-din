"""Hebrew calendar utility — flags Shabbat / Yom Tov / fast days for hearing scheduling."""
from datetime import datetime, date
from typing import Optional
from pyluach.dates import GregorianDate

# Holiday names from pyluach we treat as blocking. Shabbat is detected separately by weekday.
# Note: pyluach.holiday() returns names like 'Pesach', 'Shavuos', 'Rosh Hashana', 'Yom Kippur',
# 'Succos', 'Shmini Atzeres', 'Simchas Torah', 'Chanuka', 'Tu B\'Shvat', 'Purim', 'Lag Ba\'omer',
# 'Tu B\'Av', 'Tisha B\'Av', 'Tzom Gedalia', "Asara B'Teves", "Taanis Esther", 'Shiva Asar B\'Tamuz'.
# We block Yom Tov and major fast days. Minor occasions (Tu B'Shvat, Lag Ba'omer, Tu B'Av) are not blocked.
BLOCKED_HOLIDAYS = {
    "Pesach", "Shavuos", "Rosh Hashana", "Yom Kippur",
    "Succos", "Shmini Atzeres", "Simchas Torah",
    "Tisha B'Av", "Yom Kippur",
    "Tzom Gedalia", "Asara B'Teves", "Taanis Esther", "Shiva Asar B'Tamuz",
}


def check_date(dt: datetime | date) -> Optional[str]:
    """
    Return a Hebrew reason string if the date is blocked (Shabbat/Yom Tov/fast),
    or None if it's a regular working day.
    """
    if isinstance(dt, datetime):
        dt = dt.date()

    g = GregorianDate(dt.year, dt.month, dt.day)
    # weekday: 1=Sunday ... 7=Saturday
    if g.weekday() == 7:
        return "שבת"
    # erev shabbat afternoon — not blocked here (admin's call), only the day itself

    h = g.to_heb()
    holiday = h.holiday(israel=True)
    if holiday and holiday in BLOCKED_HOLIDAYS:
        # Map English holiday names to Hebrew
        hebrew_names = {
            "Pesach": "פסח",
            "Shavuos": "שבועות",
            "Rosh Hashana": "ראש השנה",
            "Yom Kippur": "יום כיפור",
            "Succos": "סוכות",
            "Shmini Atzeres": "שמיני עצרת",
            "Simchas Torah": "שמחת תורה",
            "Tisha B'Av": "תשעה באב",
            "Tzom Gedalia": "צום גדליה",
            "Asara B'Teves": "עשרה בטבת",
            "Taanis Esther": "תענית אסתר",
            "Shiva Asar B'Tamuz": "שבעה עשר בתמוז",
        }
        return hebrew_names.get(holiday, holiday)

    return None
