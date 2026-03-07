def get_fallback_prediction(item):
    if item.get("avg_daily_usage", 0) <= 0:
        return None

    days_remaining = item["quantity"] / item["avg_daily_usage"]
    reorder = days_remaining <= item.get("reorder_threshold", 10)
    
    return {
        "days_until_stockout": round(days_remaining, 1),
        "reorder_recommended": reorder,
        "prediction_source": "rule_based_fallback",
        "confidence": "high"
    }
