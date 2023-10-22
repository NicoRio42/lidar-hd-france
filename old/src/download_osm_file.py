from pyproj import Proj, transform
import requests

from src.helpers.extract_extrems_from_polygon import extract_extrems_from_polygon


def download_osm_file(border_coords: list[list[float]]) -> None:
    [minimum, maximum] = extract_extrems_from_polygon(border_coords)

    inProj = Proj(init="epsg:2154")
    outProj = Proj(init="epsg:3857")

    min_lon, max_lon, min_lat, max_lat = transform(
        inProj, outProj, minimum[0], maximum[0], minimum[1], maximum[1]
    )

    url = f"https://www.openstreetmap.org/api/0.6/map?bbox={min_lon}%2C{min_lat}%2C{max_lon}%2C{max_lat}"

    response = requests.get(url, stream=True)

    if response.status_code != 200:
        print("Error while downloading osm data")
        return

    with open("map.osm", "wb") as f:
        f.write(response.content)
