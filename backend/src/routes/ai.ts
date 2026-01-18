import { Router, Request, Response } from 'express';
import AITripPlannerService from '../services/AITripPlannerService.js';
import LocationService from '../services/LocationService.js';

const router = Router();

/**
 * POST /api/ai/generate-itinerary
 * Generate a detailed AI-powered itinerary for a destination
 */
router.post('/generate-itinerary', async (req: Request, res: Response) => {
  try {
    const { destination, days = 3, interests } = req.body;

    if (!destination) {
      res.status(400).json({ error: 'Destination is required' });
      return;
    }

    if (days < 1 || days > 365) {
      res.status(400).json({ error: 'Days must be between 1 and 365' });
      return;
    }

    const result = await AITripPlannerService.generateDetailedItinerary(
      destination,
      days,
      interests
    );

    res.json(result);
  } catch (error) {
    console.error('Error generating itinerary:', error);
    res.status(500).json({
      error: 'Failed to generate itinerary',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/ai/refine-itinerary
 * Refine existing itinerary based on user feedback
 */
router.post('/refine-itinerary', async (req: Request, res: Response) => {
  try {
    const { currentItinerary, destination, feedback, days } = req.body;

    if (!currentItinerary || !destination || !feedback) {
      res
        .status(400)
        .json({
          error:
            'currentItinerary, destination, and feedback are required',
        });
      return;
    }

    const result = await AITripPlannerService.refineItinerary(
      currentItinerary,
      destination,
      feedback,
      days || 3
    );

    res.json(result);
  } catch (error) {
    console.error('Error refining itinerary:', error);
    res.status(500).json({
      error: 'Failed to refine itinerary',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/ai/recommendations
 * Get recommendations for a location
 */
router.get('/recommendations', async (req: Request, res: Response) => {
  try {
    const { location, type = 'general' } = req.query;

    if (!location) {
      res.status(400).json({ error: 'Location is required' });
      return;
    }

    if (
      !['restaurants', 'attractions', 'events', 'general'].includes(
        type as string
      )
    ) {
      res.status(400).json({
        error: 'Type must be one of: restaurants, attractions, events, general',
      });
      return;
    }

    const recommendations =
      await AITripPlannerService.getLocationRecommendations(
        location as string,
        type as 'restaurants' | 'attractions' | 'events' | 'general'
      );

    res.json({ location, type, recommendations });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      error: 'Failed to get recommendations',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/ai/search-location
 * Search for a location
 */
router.get('/search-location', async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    if (!query) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    const results = await LocationService.searchLocation(query as string);
    res.json({ query, results });
  } catch (error) {
    console.error('Error searching location:', error);
    res.status(500).json({
      error: 'Failed to search location',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/ai/location-info
 * Get detailed information about a location (coordinates, weather, country info)
 */
router.get('/location-info', async (req: Request, res: Response) => {
  try {
    const { location } = req.query;

    if (!location) {
      res.status(400).json({ error: 'Location is required' });
      return;
    }

    const coordinates = await LocationService.getCoordinates(location as string);

    if (!coordinates) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }

    const [weather, countryInfo] = await Promise.all([
      LocationService.getWeather(coordinates.lat, coordinates.lon),
      LocationService.getCountryInfo(
        coordinates.lat.toString().split('.')[0]
      ), // Simplified country lookup
    ]);

    res.json({
      location,
      coordinates,
      weather,
      countryInfo,
    });
  } catch (error) {
    console.error('Error getting location info:', error);
    res.status(500).json({
      error: 'Failed to get location info',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
