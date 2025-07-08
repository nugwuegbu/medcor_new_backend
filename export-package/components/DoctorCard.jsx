import React from 'react';
import { Star, Clock, MapPin, Phone, Mail } from 'lucide-react';

export const DoctorCard = ({ 
  doctor, 
  onBookAppointment, 
  onViewProfile,
  className = "",
  compact = false 
}) => {
  const {
    id,
    name,
    specialty,
    experience,
    rating,
    reviewCount,
    availability,
    photo,
    location,
    phone,
    email,
    education,
    languages = []
  } = doctor;

  if (compact) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}>
        <div className="flex items-center gap-3">
          <img 
            src={photo || '/api/placeholder/60/60'} 
            alt={name}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
              {name}
            </h3>
            <p className="text-purple-600 dark:text-purple-400 text-xs">
              {specialty}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-gray-600 dark:text-gray-300">
                {rating} ({reviewCount})
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onViewProfile?.(doctor)}
            className="flex-1 px-3 py-1.5 text-xs border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
          >
            View Profile
          </button>
          <button
            onClick={() => onBookAppointment?.(doctor)}
            className="flex-1 px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Book Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}>
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <img 
          src={photo || '/api/placeholder/80/80'} 
          alt={name}
          className="w-20 h-20 rounded-full object-cover ring-4 ring-purple-100 dark:ring-purple-800"
        />
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            {name}
          </h3>
          <p className="text-purple-600 dark:text-purple-400 font-medium mb-2">
            {specialty}
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-1">
              <Clock size={16} />
              <span>{experience} years</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{rating} ({reviewCount} reviews)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Education */}
      {education && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Education</h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">{education}</p>
        </div>
      )}

      {/* Languages */}
      {languages.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Languages</h4>
          <div className="flex flex-wrap gap-2">
            {languages.map((lang, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 text-xs rounded-full"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <MapPin size={16} />
          <span>{location}</span>
        </div>
        {phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Phone size={16} />
            <span>{phone}</span>
          </div>
        )}
        {email && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Mail size={16} />
            <span>{email}</span>
          </div>
        )}
      </div>

      {/* Availability */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${availability === 'available' ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {availability === 'available' ? 'Available Today' : 'Busy'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => onViewProfile?.(doctor)}
          className="flex-1 px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
        >
          View Full Profile
        </button>
        <button
          onClick={() => onBookAppointment?.(doctor)}
          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Book Appointment
        </button>
      </div>
    </div>
  );
};

export default DoctorCard;