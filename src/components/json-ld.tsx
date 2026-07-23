export function JsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    "name": "Tuta Suites",
    "description": "Experience luxury and comfort at Tuta Suites. Premium hotel in Assurance CDA Estate, Orimerunmu, Mowe-Ibafo featuring 24/7 security, high-speed WiFi, fine dining, and excellent hospitality.",
    "url": "https://tutasuites.com",
    "telephone": "+2348111821899",
    "email": "info@tutasuites.com",
    "image": "https://tutasuites.com/dsc_0996.jpg",
    "priceRange": "₦₦",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "No 3 Owonikoko Road, Assurance CDA Estate",
      "addressLocality": "Orimerunmu, Mowe-Ibafo",
      "addressRegion": "Ogun State",
      "addressCountry": "NG"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 6.7500, // Example coordinates, update if needed
      "longitude": 3.3900
    },
    "amenityFeature": [
      {
        "@type": "LocationFeatureSpecification",
        "name": "High-Speed WiFi",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": "24/7 Security",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": "Restaurant & Bar",
        "value": true
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
