import React from 'react';
import VideoEditor from './VideoEditor';
import ImageEditor from './ImageEditor';

const MediaEditor = ({ file, onSave, onCancel }) => {
  const isVideo = file.type.startsWith('video');

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center md:p-4">
      <div className="relative w-full h-full md:h-[90vh] md:max-w-7xl bg-gray-900 md:rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        {isVideo ? (
          <VideoEditor file={file} onSave={onSave} onCancel={onCancel} />
        ) : (
          <ImageEditor file={file} onSave={onSave} onCancel={onCancel} />
        )}
      </div>
    </div>
  );
};

export default MediaEditor;
