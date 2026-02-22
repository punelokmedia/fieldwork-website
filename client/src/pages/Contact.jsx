import React, { useState } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    // Real app would send to backend here
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', message: '' });
    }, 3000);
  };

  return (
    <div className="bg-white py-24 sm:py-32 flex-1 relative overflow-hidden">
      <div className="absolute top-0 right-0 -m-32 h-[500px] w-[500px] rounded-full bg-red-50 blur-[100px] z-0 pointer-events-none"></div>
      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-5xl">Let's talk workflow.</h2>
          <p className="mt-4 text-lg leading-8 text-gray-600 font-medium">
            Contact us to request higher storage limits, get training, or schedule a team rollout.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-12 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:gap-8">
          <div className="flex flex-col gap-y-12 pr-12 lg:pr-24">
            <div className="flex gap-x-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 shadow-sm border border-red-100">
                <MapPin className="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Pune Headquarters</h3>
                <p className="mt-2 text-base leading-7 text-gray-500 font-medium">
                  FieldWork Media Tower<br />
                  Pune IT Park, Maharashtra<br />
                  India 411038
                </p>
              </div>
            </div>

            <div className="flex gap-x-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 shadow-sm border border-red-100">
                <Phone className="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Phone</h3>
                <p className="mt-2 text-base leading-7 text-gray-500 font-medium">
                  Sales: +91 99000 0000<br />
                  Support: +91 88000 0000
                </p>
              </div>
            </div>

            <div className="flex gap-x-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 shadow-sm border border-red-100">
                <Mail className="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Email</h3>
                <p className="mt-2 text-base leading-7 text-gray-500 font-medium">
                  hello@fieldworkmedia.app<br />
                  support@fieldworkmedia.app
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-y-6 lg:pl-12 bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold leading-6 text-gray-900 mb-2">
                Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="block w-full rounded-xl border-0 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6 transition-all"
                placeholder="Jane Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold leading-6 text-gray-900 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="block w-full rounded-xl border-0 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6 transition-all"
                placeholder="jane@example.com"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-semibold leading-6 text-gray-900 mb-2">
                Message
              </label>
              <textarea
                name="message"
                id="message"
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                className="block w-full rounded-xl border-0 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6 transition-all resize-none"
                placeholder="How can we help?"
              />
            </div>

            <button
              type="submit"
              className="mt-4 block w-full rounded-xl bg-red-600 px-3.5 py-4 text-center text-sm font-bold text-white shadow-lg hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-all hover:-translate-y-0.5"
            >
              {submitted ? "Message sent! We'll be in touch." : "Send Message"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
