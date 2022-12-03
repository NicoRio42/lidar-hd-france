def extract_extrems_from_polygon(polygon: list[list[float]]) -> list[list[float]]:
    minimum = polygon[0].copy()
    maximum = polygon[0].copy()

    for point in polygon:
        minimum[0] = point[0] if point[0] < minimum[0] else minimum[0]
        minimum[1] = point[1] if point[1] < minimum[1] else minimum[1]
        maximum[0] = point[0] if point[0] > maximum[0] else maximum[0]
        maximum[1] = point[1] if point[1] > maximum[1] else maximum[1]

    return [minimum, maximum]
