import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import VideoPlayer from "@/components/VideoPlayer";

// Disable caching to always show fresh videos
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getVideos() {
  try {
    const { prisma } = await import("@/lib/prisma");
    const setting = await prisma.settings.findUnique({
      where: { key: "homepage_videos" },
    });
    return setting?.videos || [];
  } catch (error) {
    console.error("Error fetching videos:", error);
    return [];
  }
}

async function getFeaturedProducts() {
  try {
    const { prisma } = await import("@/lib/prisma");
    const products = await prisma.product.findMany({
      where: { isActive: true },
      take: 6,
      orderBy: { createdAt: "desc" },
    });
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export default async function HomePage() {
  const videos = await getVideos();
  const products = await getFeaturedProducts();

  return (
    <>
      <Header />
      <main>
        {/* Full Screen Video Section */}
        <section className="relative w-full h-screen overflow-hidden">
          <VideoPlayer videos={videos} />
          {/* Overlay with scroll indicator */}
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-center">
            <p className="mb-2 font-semibold">Scroll to explore</p>
            <svg
              className="w-6 h-6 mx-auto animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </section>

        {/* Our Products */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-bold mb-2 text-gray-900">
                  Products
                </h2>
                <p className="text-gray-600">
                  Naturally sourced organic fertilizers for healthy plants
                </p>
              </div>
              <Link
                href="/products"
                className="text-primary-600 hover:text-primary-700 font-medium text-sm mt-4 md:mt-0 flex items-center gap-1"
              >
                View all →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.length > 0 ? (
                products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="col-span-3 text-center py-16">
                  <p className="text-gray-500 text-lg">
                    No products available. Please add products from the admin
                    panel.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Organic Benefits */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-2 text-gray-900">
                About Organic Fertilizers
              </h2>
              <p className="text-gray-600">
                Natural choices for healthier soil and stronger plants
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-gray-700"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  Nutrient Rich
                </h3>
                <p className="text-gray-700">
                  100% organic ingredients packed with essential nutrients for
                  optimal plant growth
                </p>
              </div>

              <div className="benefit-card">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-gray-700"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.3A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2 text-gray-900">
                  Soil Enrichment
                </h3>
                <p className="text-sm text-gray-700">
                  Improves soil structure and microbial activity
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-gray-700"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.343a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM15.657 14.657a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2 text-gray-900">
                  Eco-Friendly
                </h3>
                <p className="text-sm text-gray-700">
                  No harmful chemicals or synthetic additives
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Information Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              Organic Fertilizers for Gardens
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Natural and sustainable way to nourish your plants and improve
              soil health
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">100% Organic</h3>
                <p className="text-gray-600">
                  Pure cow manure with no chemical additives
                </p>
              </div>

              <div className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
                <p className="text-gray-600">
                  Quick and reliable shipping across India
                </p>
              </div>

              <div className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Quality Guaranteed
                </h3>
                <p className="text-gray-600">
                  Premium quality products for best results
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section id="about" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold mb-6 text-gray-900 text-center">
                About Orgobloom
              </h2>
              <p className="text-xl text-center text-primary-600 mb-8">
                Your trusted partner for premium organic fertilizers
              </p>
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-600 mb-4">
                  Orgobloom was founded with a simple mission: to provide
                  farmers and gardeners with the highest quality organic
                  fertilizers that nurture both plants and soil. We believe in
                  sustainable agriculture and the power of natural nutrients.
                </p>
                <p className="text-gray-600 mb-8">
                  Our journey began when we recognized the need for reliable,
                  eco-friendly fertilizer solutions that don&apos;t compromise
                  on effectiveness. Today, we serve thousands of customers
                  across the country, helping them grow healthier crops and
                  gardens.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 mt-12">
                <div className="text-center">
                  <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-primary-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Quality First</h3>
                  <p className="text-gray-600">
                    We source only the finest organic ingredients for our
                    fertilizers
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-primary-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Sustainability</h3>
                  <p className="text-gray-600">
                    Committed to eco-friendly practices and environmental
                    stewardship
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-primary-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Customer Focus</h3>
                  <p className="text-gray-600">
                    Dedicated support and guidance for all your farming needs
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Certifications & Trust Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="section-title mb-4">Trusted & Certified</h2>
              <p className="section-subtitle text-center">
                Meeting international standards for quality and sustainability
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              <div className="trust-badge">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-yellow-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16v0zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900">100% Organic</h3>
                <p className="text-sm text-gray-600">
                  No chemicals or additives
                </p>
              </div>

              <div className="trust-badge">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-50 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900">Field Tested</h3>
                <p className="text-sm text-gray-600">Proven by thousands</p>
              </div>

              <div className="trust-badge">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-50 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-2.77 3.058 3.058 0 00-3.064 3.067 3.065 3.065 0 001.318 2.7A3.066 3.066 0 006.267 3.455zm9.5 2.945a3.066 3.066 0 01-3.064-3.067 3.063 3.063 0 011.745-2.77 3.066 3.066 0 01-.001 5.837zm7.38 5.51a.75.75 0 00-.688-.688h-.701a.75.75 0 00-.688.688v5.25c0 .397.288.75.688.75h.701a.75.75 0 00.688-.75v-5.25zm-2.378-3.5a.75.75 0 00-.688-.688h-.701a.75.75 0 00-.688.688v8.75c0 .397.288.75.688.75h.701a.75.75 0 00.688-.75v-8.75zM4.5 6.5a.75.75 0 00-.688-.688h-.701a.75.75 0 00-.688.688v12c0 .397.288.75.688.75h.701a.75.75 0 00.688-.75v-12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900">Lab Verified</h3>
                <p className="text-sm text-gray-600">Quality assured</p>
              </div>

              <div className="trust-badge">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-emerald-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2 5a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm14 1v-1H4v1h12zm0 3H4v4h12V9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-900">Eco-Friendly</h3>
                <p className="text-sm text-gray-600">Sustainable practices</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="section-title mb-4">
                How Organic Fertilizer Works
              </h2>
              <p className="section-subtitle text-center">
                A natural cycle of growth and renewal
              </p>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-4 gap-6">
                {/* Step 1 */}
                <div className="text-center">
                  <div className="relative mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto text-white font-bold text-2xl shadow-lg">
                      1
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3">Apply</h3>
                  <p className="text-sm text-gray-600">
                    Mix our organic fertilizer into your soil or apply as a top
                    dressing
                  </p>
                </div>

                {/* Arrow */}
                <div className="hidden md:flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-primary-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>

                {/* Step 2 */}
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto text-white font-bold text-2xl shadow-lg">
                    2
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 mt-6">Nourish</h3>
                  <p className="text-sm text-gray-600">
                    Nutrients release slowly, feeding your plants over months
                  </p>
                </div>

                {/* Arrow */}
                <div className="hidden md:flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-primary-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>

                {/* Step 3 */}
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto text-white font-bold text-2xl shadow-lg">
                    3
                  </div>
                  <h3 className="font-bold text-gray-900 mb-3 mt-6">Thrive</h3>
                  <p className="text-sm text-gray-600">
                    Watch your plants grow stronger and healthier naturally
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Shop on Platforms Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-2 text-gray-900">
                  Shop Conveniently
                </h2>
                <p className="text-gray-600">
                  Available on major e-commerce platforms across India
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Amazon */}
                <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
                  <div className="text-center mb-4">
                    <div className="mb-4 text-4xl">📦</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {" "}
                      Amazon India
                    </h3>
                    <p className="text-sm text-gray-600">
                      Shop with Prime eligibility for fast delivery
                    </p>
                  </div>
                  <a
                    href="https://amazon.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-orange-600 text-white py-2 rounded hover:bg-orange-700 transition font-medium text-sm"
                  >
                    Visit Store →
                  </a>
                </div>

                {/* Flipkart */}
                <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
                  <div className="text-center mb-4">
                    <div className="mb-4 text-4xl">🛒</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Flipkart
                    </h3>
                    <p className="text-sm text-gray-600">
                      Assured quality with Flipkart Plus benefits
                    </p>
                  </div>
                  <a
                    href="https://flipkart.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-medium text-sm"
                  >
                    Visit Store →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl font-bold mb-4 text-gray-900 text-center">
                What Our Customers Say
              </h2>
              <p className="text-xl text-gray-600 text-center mb-12">
                Join thousands of satisfied customers who have transformed their
                gardens
              </p>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Testimonial 1 */}
                <div className="testimonial-card">
                  <div className="flex items-center mb-4">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className="w-5 h-5 fill-current"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">
                    &ldquo;Orgobloom&apos;s fertilizers have completely
                    transformed my garden! My plants are healthier and more
                    vibrant than ever before. Highly recommend!&rdquo;
                  </p>
                  <div className="border-t pt-4">
                    <p className="font-semibold text-gray-900">Rajesh Kumar</p>
                    <p className="text-sm text-gray-500">Delhi, India</p>
                  </div>
                </div>

                {/* Testimonial 2 */}
                <div className="testimonial-card">
                  <div className="flex items-center mb-4">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className="w-5 h-5 fill-current"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">
                    &ldquo;Best organic fertilizer I&apos;ve used! The quality
                    is consistent and the customer service is exceptional. My
                    crops have never been better.&rdquo;
                  </p>
                  <div className="border-t pt-4">
                    <p className="font-semibold text-gray-900">Priya Sharma</p>
                    <p className="text-sm text-gray-500">Bangalore, India</p>
                  </div>
                </div>

                {/* Testimonial 3 */}
                <div className="testimonial-card">
                  <div className="flex items-center mb-4">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className="w-5 h-5 fill-current"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">
                    &ldquo;Switched to Orgobloom and couldn&apos;t be happier!
                    The pricing is competitive and the delivery is fast. This is
                    my go-to brand now.&rdquo;
                  </p>
                  <div className="border-t pt-4">
                    <p className="font-semibold text-gray-900">Amit Patel</p>
                    <p className="text-sm text-gray-500">Mumbai, India</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-6 text-gray-900">
                Contact Us
              </h2>
              <p className="text-xl text-gray-600 mb-12">
                We&apos;d love to hear from you. Get in touch with our team.
              </p>

              <div className="grid md:grid-cols-3 gap-8 mb-12">
                {/* Email */}
                <div className="flex flex-col items-center">
                  <div className="bg-primary-100 p-4 rounded-full mb-4">
                    <svg
                      className="w-8 h-8 text-primary-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-2">Email</h3>
                  <p className="text-gray-600">support@orgobloom.com</p>
                  <p className="text-gray-600">sales@orgobloom.com</p>
                </div>

                {/* Phone */}
                <div className="flex flex-col items-center">
                  <div className="bg-primary-100 p-4 rounded-full mb-4">
                    <svg
                      className="w-8 h-8 text-primary-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-2">Phone</h3>
                  <p className="text-gray-600">+91 1800-123-4567</p>
                  <p className="text-gray-600 text-sm">
                    Mon-Sat: 9:00 AM - 6:00 PM
                  </p>
                </div>

                {/* Address */}
                <div className="flex flex-col items-center">
                  <div className="bg-primary-100 p-4 rounded-full mb-4">
                    <svg
                      className="w-8 h-8 text-primary-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold mb-2">Address</h3>
                  <p className="text-gray-600">123 Green Valley Road</p>
                  <p className="text-gray-600">New Delhi, India - 110001</p>
                </div>
              </div>

              <div className="bg-primary-50 p-8 rounded-lg">
                <h3 className="text-2xl font-bold mb-4">Send Us a Message</h3>
                <p className="text-gray-600 mb-4">
                  For inquiries, please email us at{" "}
                  <a
                    href="mailto:support@orgobloom.com"
                    className="text-primary-600 hover:underline"
                  >
                    support@orgobloom.com
                  </a>{" "}
                  or call us at{" "}
                  <a
                    href="tel:+911800123456"
                    className="text-primary-600 hover:underline"
                  >
                    +91 1800-123-4567
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-20 bg-gradient-to-r from-primary-700 to-primary-900 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Grow with Us
              </h2>
              <p className="text-lg text-primary-100 mb-8">
                Get exclusive gardening tips, product updates, and special
                offers delivered to your inbox
              </p>
              <form className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="input text-gray-900 placeholder-gray-500 flex-1"
                  required
                />
                <button
                  type="submit"
                  className="cta-button bg-white text-primary-600 font-bold hover:bg-gray-100"
                >
                  Subscribe
                </button>
              </form>
              <p className="text-sm text-primary-200 mt-4">
                ✓ No spam. Just gardening wisdom and special deals.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Garden?
            </h2>
            <p className="text-xl mb-8 text-primary-100">
              Join thousands of gardeners using Orgobloom organic fertilizers
            </p>
            <Link
              href="/products"
              className="cta-button bg-white text-primary-600 hover:bg-primary-50 inline-block"
            >
              Explore Products Now →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
