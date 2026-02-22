import React from 'react';

const About = () => {
  return (
    <div className="bg-white py-24 sm:py-32 flex-1">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-6">About Pune Lok Media</h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            We are dedicated to bringing accurate, fast, and high-quality local news directly to the people. Our field reporting platform ensures our journalists can edit, format, and publish breaking stories from absolutely anywhere.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mx-0 lg:max-w-none">
          <div className="grid grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                <span className="h-2 w-2 rounded-full bg-red-600 shadow border border-red-500"></span>
                Our Mission
              </div>
              <p className="mt-4 flex-auto text-base leading-7 text-gray-600">
                To empower communities by democratizing access to powerful ground-level reporting tools.
              </p>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                <span className="h-2 w-2 rounded-full bg-blue-600 shadow border border-blue-500"></span>
                Our Vision
              </div>
              <p className="mt-4 flex-auto text-base leading-7 text-gray-600">
                A world where every local voice gets studio-quality production without technical barriers.
              </p>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                <span className="h-2 w-2 rounded-full bg-emerald-600 shadow border border-emerald-500"></span>
                Our Technology
              </div>
              <p className="mt-4 flex-auto text-base leading-7 text-gray-600">
                Next-generation WebAssembly media processing giving mobile phones the power of a desktop suite.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
