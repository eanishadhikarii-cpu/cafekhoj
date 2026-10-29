import logging
import urllib.parse
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


def sync_cafe_google_places(cafe) -> dict:
    """
    Safely retrieves and updates Google Places information (place_id, rating, review count, maps URL)
    for a cafe. Gracefully fails if unconfigured or unreachable.
    Never allows operators or admins to manufacture or manually alter official Google data.
    """
    api_key = getattr(settings, 'GOOGLE_PLACES_API_KEY', '').strip()
    if not api_key:
        cafe.google_sync_status = 'unconfigured'
        cafe.save(update_fields=['google_sync_status'])
        return {
            'status': 'unconfigured',
            'message': 'Google Places integration is not configured. Set GOOGLE_PLACES_API_KEY to activate.'
        }

    try:
        import urllib.request
        import json

        # Step 1: Find Place if place_id is not already known
        place_id = cafe.google_place_id
        if not place_id:
            query = f"{cafe.name} {cafe.address} {cafe.location.city} Nepal"
            encoded_query = urllib.parse.quote(query)
            find_url = (
                f"https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
                f"?input={encoded_query}&inputtype=textquery&fields=place_id,name&key={api_key}"
            )
            req = urllib.request.Request(find_url, headers={'User-Agent': 'CafeKhoj/1.0'})
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode('utf-8'))
                candidates = data.get('candidates', [])
                if candidates:
                    place_id = candidates[0].get('place_id')

        if not place_id:
            cafe.google_sync_status = 'not_found'
            cafe.google_last_synced_at = timezone.now()
            cafe.save(update_fields=['google_sync_status', 'google_last_synced_at'])
            return {
                'status': 'not_found',
                'message': f"No matching Google Maps place found for '{cafe.name}' in {cafe.location.city}."
            }

        # Step 2: Fetch Place Details
        details_url = (
            f"https://maps.googleapis.com/maps/api/place/details/json"
            f"?place_id={place_id}&fields=name,rating,user_ratings_total,url&key={api_key}"
        )
        req = urllib.request.Request(details_url, headers={'User-Agent': 'CafeKhoj/1.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            result = res_data.get('result', {})

            rating = result.get('rating')
            user_ratings_total = result.get('user_ratings_total')
            maps_url = result.get('url', f"https://www.google.com/maps/place/?q=place_id:{place_id}")

            cafe.google_place_id = place_id
            if rating is not None:
                cafe.google_rating = round(float(rating), 2)
            if user_ratings_total is not None:
                cafe.google_user_ratings_total = int(user_ratings_total)
            if maps_url:
                cafe.google_maps_url = maps_url

            cafe.google_sync_status = 'synced'
            cafe.google_last_synced_at = timezone.now()
            cafe.save(update_fields=[
                'google_place_id', 'google_rating', 'google_user_ratings_total',
                'google_maps_url', 'google_sync_status', 'google_last_synced_at'
            ])

            return {
                'status': 'synced',
                'place_id': place_id,
                'google_rating': float(cafe.google_rating) if cafe.google_rating else None,
                'google_user_ratings_total': cafe.google_user_ratings_total,
                'google_maps_url': cafe.google_maps_url,
            }

    except Exception as exc:
        logger.warning(f"Google Places sync failed for cafe {cafe.id}: {exc}")
        cafe.google_sync_status = 'error'
        cafe.google_last_synced_at = timezone.now()
        cafe.save(update_fields=['google_sync_status', 'google_last_synced_at'])
        return {
            'status': 'error',
            'message': f"Google Places API temporarily unavailable: {exc}"
        }

