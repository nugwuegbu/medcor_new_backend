interface MapLocation {
  lat: number;
  lng: number;
  address?: string;
  name?: string;
}

interface TrafficData {
  location: MapLocation;
  trafficLevel: 'low' | 'moderate' | 'heavy' | 'severe';
  averageSpeed: number;
  delayMinutes: number;
  incidents?: TrafficIncident[];
}

interface TrafficIncident {
  type: 'accident' | 'construction' | 'congestion' | 'road_closure';
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  location: MapLocation;
  estimatedEndTime?: Date;
}

interface RouteOptions {
  origin: MapLocation;
  destination: MapLocation;
  waypoints?: MapLocation[];
  mode: 'driving' | 'walking' | 'transit' | 'bicycling';
  avoidTolls?: boolean;
  avoidHighways?: boolean;
  departureTime?: Date;
  alternatives?: boolean;
}

interface RouteResult {
  distance: string;
  duration: string;
  durationInTraffic?: string;
  steps: RouteStep[];
  polyline: string;
  trafficConditions?: TrafficData[];
  alternativeRoutes?: RouteResult[];
}

interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
  startLocation: MapLocation;
  endLocation: MapLocation;
  maneuver?: string;
}

interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  location: MapLocation;
  rating?: number;
  userRatingsTotal?: number;
  priceLevel?: number;
  types: string[];
  openingHours?: OpeningHours;
  reviews?: Review[];
  photos?: string[];
  phoneNumber?: string;
  website?: string;
  wheelchairAccessible?: boolean;
}

interface OpeningHours {
  openNow: boolean;
  periods: Array<{
    open: { day: number; time: string };
    close: { day: number; time: string };
  }>;
  weekdayText: string[];
}

interface Review {
  authorName: string;
  rating: number;
  text: string;
  time: Date;
  language: string;
}

interface StreetViewOptions {
  location: MapLocation;
  heading?: number;
  pitch?: number;
  fov?: number;
  size?: { width: number; height: number };
}

export class GoogleMapsAgent {
  private apiKey: string;
  private baseUrl: string = 'https://maps.googleapis.com/maps/api';
  private clinicLocation: MapLocation = {
    lat: 25.1972,
    lng: 55.3233,
    name: "Medcor Clinic",
    address: "Dubai Healthcare City"
  };

  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
  }

  /**
   * Get real-time traffic data for a specific location or route
   */
  async getTrafficData(location: MapLocation, radius: number = 5000): Promise<TrafficData> {
    try {
      if (!this.apiKey) {
        return this.getMockTrafficData(location);
      }

      // Use Google Maps Roads API for traffic data
      const response = await fetch(
        `${this.baseUrl}/distancematrix/json?` +
        `origins=${location.lat},${location.lng}&` +
        `destinations=${location.lat},${location.lng}&` +
        `departure_time=now&` +
        `traffic_model=best_guess&` +
        `key=${this.apiKey}`
      );

      const data = await response.json();
      
      // Parse traffic conditions from the response
      return this.parseTrafficData(data, location);
    } catch (error) {
      console.error('Traffic data error:', error);
      return this.getMockTrafficData(location);
    }
  }

  /**
   * Plan a route with multiple stops and traffic consideration
   */
  async planRoute(options: RouteOptions): Promise<RouteResult> {
    try {
      if (!this.apiKey) {
        return this.getMockRoute(options);
      }

      const waypoints = options.waypoints?.map(w => `${w.lat},${w.lng}`).join('|') || '';
      
      const response = await fetch(
        `${this.baseUrl}/directions/json?` +
        `origin=${options.origin.lat},${options.origin.lng}&` +
        `destination=${options.destination.lat},${options.destination.lng}&` +
        `waypoints=${waypoints}&` +
        `mode=${options.mode}&` +
        `departure_time=${options.departureTime?.getTime() || 'now'}&` +
        `alternatives=${options.alternatives || false}&` +
        `avoid=${this.getAvoidanceString(options)}&` +
        `key=${this.apiKey}`
      );

      const data = await response.json();
      return this.parseRouteData(data);
    } catch (error) {
      console.error('Route planning error:', error);
      return this.getMockRoute(options);
    }
  }

  /**
   * Get detailed place information with reviews and ratings
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    try {
      if (!this.apiKey) {
        return this.getMockPlaceDetails(placeId);
      }

      const response = await fetch(
        `${this.baseUrl}/place/details/json?` +
        `place_id=${placeId}&` +
        `fields=name,formatted_address,geometry,rating,user_ratings_total,` +
        `price_level,types,opening_hours,reviews,photos,formatted_phone_number,` +
        `website,wheelchair_accessible_entrance&` +
        `key=${this.apiKey}`
      );

      const data = await response.json();
      
      if (data.status === 'OK' && data.result) {
        return this.parsePlaceDetails(data.result);
      }
      
      return null;
    } catch (error) {
      console.error('Place details error:', error);
      return this.getMockPlaceDetails(placeId);
    }
  }

  /**
   * Search for places near a location with filters
   */
  async searchNearbyPlaces(
    location: MapLocation,
    type: string,
    radius: number = 5000
  ): Promise<PlaceDetails[]> {
    try {
      if (!this.apiKey) {
        return this.getMockNearbyPlaces(location, type);
      }

      const response = await fetch(
        `${this.baseUrl}/place/nearbysearch/json?` +
        `location=${location.lat},${location.lng}&` +
        `radius=${radius}&` +
        `type=${type}&` +
        `key=${this.apiKey}`
      );

      const data = await response.json();
      
      if (data.status === 'OK' && data.results) {
        // Get detailed info for top 5 results
        const topPlaces = data.results.slice(0, 5);
        const detailedPlaces = await Promise.all(
          topPlaces.map((place: any) => this.getPlaceDetails(place.place_id))
        );
        
        return detailedPlaces.filter((place): place is PlaceDetails => place !== null);
      }
      
      return [];
    } catch (error) {
      console.error('Nearby places search error:', error);
      return this.getMockNearbyPlaces(location, type);
    }
  }

  /**
   * Get Street View image URL for a location
   */
  getStreetViewUrl(options: StreetViewOptions): string {
    if (!this.apiKey) {
      // Return a placeholder image URL
      return '/api/placeholder-street-view.jpg';
    }

    const size = options.size || { width: 600, height: 400 };
    const heading = options.heading || 0;
    const pitch = options.pitch || 0;
    const fov = options.fov || 90;

    return `${this.baseUrl}/streetview?` +
      `location=${options.location.lat},${options.location.lng}&` +
      `size=${size.width}x${size.height}&` +
      `heading=${heading}&` +
      `pitch=${pitch}&` +
      `fov=${fov}&` +
      `key=${this.apiKey}`;
  }

  /**
   * Get directions to clinic from patient location
   */
  async getDirectionsToClinic(
    patientLocation: MapLocation,
    mode: 'driving' | 'walking' | 'transit' = 'driving'
  ): Promise<RouteResult> {
    return this.planRoute({
      origin: patientLocation,
      destination: this.clinicLocation,
      mode,
      alternatives: true
    });
  }

  /**
   * Find best route considering current traffic
   */
  async findOptimalRoute(
    origin: MapLocation,
    destination: MapLocation,
    considerTraffic: boolean = true
  ): Promise<RouteResult> {
    const routeOptions: RouteOptions = {
      origin,
      destination,
      mode: 'driving',
      alternatives: true,
      departureTime: considerTraffic ? new Date() : undefined
    };

    const result = await this.planRoute(routeOptions);
    
    // Add traffic data for the route
    if (considerTraffic && result.steps.length > 0) {
      const trafficPromises = result.steps.map(step => 
        this.getTrafficData(step.startLocation, 1000)
      );
      result.trafficConditions = await Promise.all(trafficPromises);
    }

    return result;
  }

  // Helper methods
  private getAvoidanceString(options: RouteOptions): string {
    const avoidances = [];
    if (options.avoidTolls) avoidances.push('tolls');
    if (options.avoidHighways) avoidances.push('highways');
    return avoidances.join('|');
  }

  private parseTrafficData(data: any, location: MapLocation): TrafficData {
    // Parse Google Maps API response to extract traffic information
    const trafficLevel = this.determineTrafficLevel(data);
    
    return {
      location,
      trafficLevel,
      averageSpeed: data.averageSpeed || 40,
      delayMinutes: data.delayMinutes || 0,
      incidents: []
    };
  }

  private determineTrafficLevel(data: any): 'low' | 'moderate' | 'heavy' | 'severe' {
    // Logic to determine traffic level from API response
    const durationInTraffic = data.rows?.[0]?.elements?.[0]?.duration_in_traffic?.value;
    const normalDuration = data.rows?.[0]?.elements?.[0]?.duration?.value;
    
    if (!durationInTraffic || !normalDuration) return 'low';
    
    const ratio = durationInTraffic / normalDuration;
    
    if (ratio < 1.2) return 'low';
    if (ratio < 1.5) return 'moderate';
    if (ratio < 2.0) return 'heavy';
    return 'severe';
  }

  private parseRouteData(data: any): RouteResult {
    const route = data.routes?.[0];
    if (!route) {
      throw new Error('No route found');
    }

    const leg = route.legs?.[0];
    
    return {
      distance: leg.distance.text,
      duration: leg.duration.text,
      durationInTraffic: leg.duration_in_traffic?.text,
      steps: leg.steps.map((step: any) => ({
        instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
        distance: step.distance.text,
        duration: step.duration.text,
        startLocation: {
          lat: step.start_location.lat,
          lng: step.start_location.lng
        },
        endLocation: {
          lat: step.end_location.lat,
          lng: step.end_location.lng
        },
        maneuver: step.maneuver
      })),
      polyline: route.overview_polyline.points,
      alternativeRoutes: data.routes.slice(1).map((r: any) => 
        this.parseRouteData({ routes: [r] })
      )
    };
  }

  private parsePlaceDetails(place: any): PlaceDetails {
    return {
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      },
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      priceLevel: place.price_level,
      types: place.types || [],
      openingHours: place.opening_hours ? {
        openNow: place.opening_hours.open_now,
        periods: place.opening_hours.periods || [],
        weekdayText: place.opening_hours.weekday_text || []
      } : undefined,
      reviews: place.reviews?.map((review: any) => ({
        authorName: review.author_name,
        rating: review.rating,
        text: review.text,
        time: new Date(review.time * 1000),
        language: review.language
      })) || [],
      photos: place.photos?.map((photo: any) => 
        `${this.baseUrl}/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${this.apiKey}`
      ) || [],
      phoneNumber: place.formatted_phone_number,
      website: place.website,
      wheelchairAccessible: place.wheelchair_accessible_entrance
    };
  }

  // Mock data methods for development
  private getMockTrafficData(location: MapLocation): TrafficData {
    return {
      location,
      trafficLevel: 'moderate',
      averageSpeed: 45,
      delayMinutes: 5,
      incidents: []
    };
  }

  private getMockRoute(options: RouteOptions): RouteResult {
    return {
      distance: "12.5 km",
      duration: "18 mins",
      durationInTraffic: "23 mins",
      steps: [
        {
          instruction: "Head north on Sheikh Zayed Road",
          distance: "5.2 km",
          duration: "6 mins",
          startLocation: options.origin,
          endLocation: { lat: 25.2048, lng: 55.2708 },
          maneuver: "straight"
        }
      ],
      polyline: "mock_polyline_data"
    };
  }

  private getMockPlaceDetails(placeId: string): PlaceDetails {
    return {
      placeId,
      name: "Life Pharmacy",
      address: "Dubai Healthcare City, Dubai",
      location: { lat: 25.1980, lng: 55.3240 },
      rating: 4.5,
      userRatingsTotal: 234,
      priceLevel: 2,
      types: ["pharmacy", "health", "store"],
      openingHours: {
        openNow: true,
        periods: [],
        weekdayText: ["Monday: 8:00 AM – 10:00 PM"]
      },
      reviews: [
        {
          authorName: "Ahmed K.",
          rating: 5,
          text: "Great pharmacy with wide selection of medicines",
          time: new Date(),
          language: "en"
        }
      ],
      photos: [],
      phoneNumber: "+971 4 123 4567",
      website: "https://lifepharmacy.com",
      wheelchairAccessible: true
    };
  }

  private getMockNearbyPlaces(location: MapLocation, type: string): PlaceDetails[] {
    const mockPlaces = {
      pharmacy: [
        {
          placeId: "mock_pharmacy_1",
          name: "Life Pharmacy",
          address: "Dubai Healthcare City",
          location: { lat: 25.1980, lng: 55.3240 },
          rating: 4.5,
          userRatingsTotal: 234,
          priceLevel: 2,
          types: ["pharmacy"],
          openingHours: {
            openNow: true,
            periods: [],
            weekdayText: ["Open 24 hours"]
          },
          reviews: [],
          photos: [],
          phoneNumber: "+971 4 123 4567",
          wheelchairAccessible: true
        }
      ],
      restaurant: [
        {
          placeId: "mock_restaurant_1",
          name: "Healthy Bites Café",
          address: "Building 14, Dubai Healthcare City",
          location: { lat: 25.1965, lng: 55.3225 },
          rating: 4.2,
          userRatingsTotal: 156,
          priceLevel: 2,
          types: ["restaurant", "cafe"],
          openingHours: {
            openNow: true,
            periods: [],
            weekdayText: ["Monday: 7:00 AM – 9:00 PM"]
          },
          reviews: [],
          photos: [],
          phoneNumber: "+971 4 234 5678",
          wheelchairAccessible: true
        }
      ]
    };

    return mockPlaces[type as keyof typeof mockPlaces] || [];
  }
}

export const googleMapsAgent = new GoogleMapsAgent();