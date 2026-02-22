import React from 'react';
import { Video, Wand2, MapPin, Users, Cloud, MonitorPlay } from 'lucide-react';

const features = [
  {
    name: 'Advanced Video Editor',
    description: 'A complete WebAssembly-powered video editor in your browser. Trim clips, crop aspects, apply Instagram-like filters, and place custom watermark logos and dynamic text securely.',
    icon: Video,
  },
  {
    name: 'AI Poster Generation',
    description: 'Transform your news prompts directly into stunning AI posters. Leverage stable-diffusion to generate news graphics when you do not have on-ground media.',
    icon: Wand2,
  },
  {
    name: 'Pune Lok Frame Auto-Application',
    description: 'Never worry about branding layouts. Apply the specialized Pune Lok Reels Frame on any video automatically, scaling visuals to perfectly fit mobile social feeds.',
    icon: MonitorPlay,
  },
  {
    name: 'Live GPS Check-ins',
    description: 'Automatically stamp your field reports with live GPS coordinates reversed geocoded seamlessly to the exact street names in the database.',
    icon: MapPin,
  },
  {
    name: 'Offline-First Reports',
    description: 'Continue working, editing, and saving your field data even while riding through network dead-zones. The app syncs everything seamlessly once internet returns.',
    icon: Cloud,
  },
  {
    name: 'Multi-Role Authorizations',
    description: 'Granular permissions that let admins monitor, review, auto-publish or reject posts before they reach millions of viewers.',
    icon: Users,
  },
];

const Features = () => {
  return (
    <div className="bg-white py-24 sm:py-32 flex-1">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-bold leading-7 text-red-600 uppercase tracking-widest">Deploy Faster</h2>
          <p className="mt-2 text-3xl font-black tracking-tight text-gray-900 sm:text-5xl">
            Everything you need for modern journalism.
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600 font-medium">
            Designed from the ground up to solve the constraints of slow networks, mobile screens, and fast turnaround editing.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            {features.map((feature) => (
              <div key={feature.name} className="relative pl-16">
                <dt className="text-base font-bold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 shadow-md">
                    <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">{feature.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
};

export default Features;
