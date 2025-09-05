import React, { useState, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';

const PhotoCapture = ({ jobId, onPhotoCapture }) => {
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef(null);

  const handlePhotoCapture = (event) => {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newPhoto = {
          id: Date.now() + Math.random(),
          url: e.target.result,
          name: file.name,
          timestamp: new Date(),
          type: 'progress'
        };
        
        setCapturedPhotos(prev => [...prev, newPhoto]);
        onPhotoCapture(jobId, newPhoto);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeletePhoto = (photoId) => {
    setCapturedPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  const photoCategories = [
    { label: 'Before Work', value: 'before', icon: 'Camera' },
    { label: 'Progress', value: 'progress', icon: 'Wrench' },
    { label: 'After Work', value: 'after', icon: 'CheckCircle' },
    { label: 'Issue Found', value: 'issue', icon: 'AlertTriangle' }
  ];

  return (
    <div className="bg-surface rounded-lg border border-border p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-heading-semibold text-text-primary">Photo Documentation</h3>
        <Button
          variant="primary"
          onClick={handleCameraClick}
          className="text-sm"
        >
          <Icon name="Camera" size={16} className="mr-2" />
          Capture Photo
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handlePhotoCapture}
        className="hidden"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {photoCategories.map(category => (
          <Button
            key={category.value}
            variant="outline"
            className="flex flex-col items-center p-4 h-auto"
          >
            <Icon name={category.icon} size={24} className="mb-2" />
            <span className="text-xs">{category.label}</span>
          </Button>
        ))}
      </div>

      {capturedPhotos.length > 0 && (
        <div>
          <h4 className="text-sm font-heading-medium text-text-primary mb-3">
            Captured Photos ({capturedPhotos.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {capturedPhotos.map(photo => (
              <div key={photo.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-background">
                  <Image
                    src={photo.url}
                    alt={`Work progress photo ${photo.name}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      className="text-white hover:text-white p-2"
                    >
                      <Icon name="Eye" size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="text-white hover:text-white p-2"
                    >
                      <Icon name="Trash2" size={16} />
                    </Button>
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    {photo.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {capturedPhotos.length === 0 && (
        <div className="text-center py-8">
          <Icon name="Camera" size={48} className="text-text-secondary mx-auto mb-3" />
          <p className="text-text-secondary">No photos captured yet</p>
          <p className="text-sm text-text-secondary mt-1">
            Tap the camera button to document your work
          </p>
        </div>
      )}
    </div>
  );
};

export default PhotoCapture;