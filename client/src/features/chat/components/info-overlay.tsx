import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Clock, Phone, ExternalLink } from "lucide-react";

interface PlaceInfo {
  name: string;
  address: string;
  distance: number;
  type: string;
  phone?: string;
  hours?: string;
  mapUrl?: string;
}

interface InfoOverlayProps {
  isVisible: boolean;
  title: string;
  places: PlaceInfo[];
  onClose: () => void;
}

export default function InfoOverlay({ isVisible, title, places, onClose }: InfoOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          className="absolute top-4 left-4 w-80 bg-white/10 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/20"
          style={{ zIndex: 50 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-lg">{title}</h3>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Places List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {places.length === 0 ? (
              <p className="text-white/70 text-sm">No places found nearby</p>
            ) : (
              places.map((place, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/10 rounded-lg p-3 border border-white/10 hover:bg-white/20 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-white font-medium text-sm mb-1">{place.name}</h4>
                      
                      <div className="flex items-center gap-2 text-white/70 text-xs mb-1">
                        <MapPin className="w-3 h-3" />
                        <span>{place.address}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-white/60 text-xs">
                        <span className="font-medium">{(place.distance / 1000).toFixed(1)} km</span>
                        {place.hours && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{place.hours}</span>
                            </div>
                          </>
                        )}
                        {place.phone && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span>{place.phone}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {place.mapUrl && (
                      <a
                        href={place.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/70 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Footer */}
          {places.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-white/50 text-xs text-center">
                Powered by Medcor AI • Real-time data
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}