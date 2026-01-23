import re

def parse_value(value_str: str) -> float:
    """
    Parses strings like '1k', '100m', '15V' into floats.
    """
    if not value_str:
        return 0.0
    
    # Remove units (V, A, Ohm, Hz, etc. - simplified)
    value_str = re.sub(r'[VAΩHzF]$', '', value_str)
    
    multipliers = {
        'k': 1e3,
        'M': 1e6,
        'G': 1e9,
        'm': 1e-3,
        'u': 1e-6,
        'n': 1e-9,
        'p': 1e-12
    }
    
    match = re.search(r'([-\d.]+)([kMGmunp]?)', value_str)
    if match:
        val = float(match.group(1))
        suffix = match.group(2)
        return val * multipliers.get(suffix, 1.0)
    
    return float(value_str)
