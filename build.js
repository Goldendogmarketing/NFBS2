const fs = require('fs');
const path = require('path');

// Load data
const data = JSON.parse(fs.readFileSync('./data/locations.json', 'utf8'));
const { business, services, counties } = data;

// Ensure directories exist
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Generate HTML head
function generateHead(title, description, canonical, prefix) {
  prefix = prefix || '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" href="${prefix}favicon.png">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <link rel="canonical" href="${canonical}">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#0F172A',
                        secondary: '#2563EB',
                        accent: '#60A5FA',
                    }
                }
            }
        }
    </script>
</head>`;
}

// Generate navigation
function generateNav(depth = 0) {
  const prefix = depth === 0 ? '' : '../'.repeat(depth);
  return `
<body class="font-sans antialiased text-gray-800 bg-gray-50">
    <!-- Top Bar -->
    <div class="bg-primary text-white py-2 text-sm">
        <div class="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-2">
            <div class="flex items-center gap-6">
                <span><i class="fa-solid fa-flag-usa text-secondary mr-2"></i>100% American Owned</span>
                <span class="hidden md:inline"><i class="fa-solid fa-award text-secondary mr-2"></i>10+ Years Experience</span>
            </div>
            <a href="tel:${business.phoneLink}" class="flex items-center gap-2 font-bold text-secondary hover:text-blue-300 transition">
                <i class="fa-solid fa-phone"></i> ${business.phone}
            </a>
        </div>
    </div>

    <!-- Navigation -->
    <nav class="bg-white shadow-md sticky top-0 z-50">
        <div class="container mx-auto px-6 py-3 flex justify-between items-center">
            <a href="${prefix}index.html" class="flex items-center gap-3">
                <img src="${prefix}logo.png" alt="${business.name}" class="h-20 w-auto">
            </a>
            <div class="hidden lg:flex items-center space-x-8">
                <a href="${prefix}sheds-for-sale.html" class="bg-secondary hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition shadow-lg">
                    Buy Now
                </a>
                <a href="${prefix}sheds.html" class="hover:text-secondary transition font-medium">Sheds - Rent-To-Own</a>
                <a href="${prefix}steel-buildings.html" class="hover:text-secondary transition font-medium">Steel Buildings</a>
                <a href="${prefix}locations.html" class="hover:text-secondary transition font-medium">Service Areas</a>
                <a href="${prefix}about.html" class="hover:text-secondary transition font-medium">About</a>
            </div>
            <button onclick="document.getElementById('mobile-menu').classList.toggle('hidden');this.querySelector('i').classList.toggle('fa-bars');this.querySelector('i').classList.toggle('fa-xmark')" class="lg:hidden text-gray-700 text-2xl focus:outline-none">
                <i class="fa-solid fa-bars"></i>
            </button>
        </div>
        <div id="mobile-menu" class="hidden lg:hidden border-t bg-white px-6 pb-4">
            <a href="${prefix}sheds-for-sale.html" class="block py-3 border-b border-gray-100 font-semibold text-secondary hover:text-blue-700 transition">Buy Now</a>
            <a href="${prefix}sheds.html" class="block py-3 border-b border-gray-100 font-medium hover:text-secondary transition">Sheds - Rent-To-Own</a>
            <a href="${prefix}steel-buildings.html" class="block py-3 border-b border-gray-100 font-medium hover:text-secondary transition">Steel Buildings</a>
            <a href="${prefix}locations.html" class="block py-3 border-b border-gray-100 font-medium hover:text-secondary transition">Service Areas</a>
            <a href="${prefix}about.html" class="block py-3 border-b border-gray-100 font-medium hover:text-secondary transition">About</a>
            <a href="tel:${business.phoneLink}" class="block py-3 font-bold text-secondary">
                <i class="fa-solid fa-phone mr-2"></i>${business.phone}
            </a>
        </div>
    </nav>`;
}

// Generate footer
function generateFooter(depth = 0) {
  const prefix = depth === 0 ? '' : '../'.repeat(depth);
  return `
    <!-- Footer -->
    <footer class="bg-gray-900 text-gray-400 py-12">
        <div class="container mx-auto px-6">
            <div class="grid md:grid-cols-4 gap-8 mb-8">
                <div>
                    <img src="${prefix}logo.png" alt="${business.name}" class="h-12 w-auto mb-4 brightness-0 invert">
                    <p class="text-sm">Quality metal buildings at affordable prices. Serving North Florida for over 10 years.</p>
                </div>
                <div>
                    <h4 class="font-bold text-white mb-4">Products</h4>
                    <ul class="space-y-2 text-sm">
                        ${services.map(s => `<li><a href="${prefix}services/${s.slug}.html" class="hover:text-secondary transition">${s.name}</a></li>`).join('\n                        ')}
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold text-white mb-4">Service Areas</h4>
                    <ul class="space-y-2 text-sm">
                        ${counties.map(c => `<li><a href="${prefix}locations/${c.slug}.html" class="hover:text-secondary transition">${c.name}</a></li>`).join('\n                        ')}
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold text-white mb-4">Contact Us</h4>
                    <ul class="space-y-2 text-sm">
                        <li><a href="tel:${business.phoneLink}" class="flex items-center gap-2 hover:text-secondary transition"><i class="fa-solid fa-phone"></i> ${business.phone}</a></li>
                        <li><a href="mailto:${business.email}" class="flex items-center gap-2 hover:text-secondary transition"><i class="fa-solid fa-envelope"></i> ${business.email}</a></li>
                        <li class="flex items-start gap-2"><i class="fa-solid fa-location-dot mt-1"></i> <span>${business.address}<br>${business.city}, ${business.state} ${business.zip}</span></li>
                    </ul>
                    <div class="mt-4 rounded-lg overflow-hidden">
                        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3456.789!2d-81.8826!3d29.6419!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s102+Whispering+Pines+Trail%2C+Interlachen%2C+FL+32148!5e0!3m2!1sen!2sus!4v1700000000000" width="100%" height="150" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Our Location"></iframe>
                    </div>
                </div>
            </div>
            <div class="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <img src="${prefix}logo.png" alt="${business.name}" class="w-[150px] h-[150px] object-contain brightness-0 invert">
                <p class="text-sm">&copy; ${new Date().getFullYear()} ${business.name}. All rights reserved.</p>
            </div>
        </div>
    </footer>
</body>
</html>`;
}

// Generate CTA Section
function generateCTA(location = '', depth = 0) {
  const prefix = depth === 0 ? '' : '../'.repeat(depth);
  const locationText = location ? ` in ${location}` : '';
  return `
    <!-- CTA Section -->
    <section class="py-16 bg-secondary text-white">
        <div class="container mx-auto px-6 text-center">
            <h2 class="text-3xl font-bold mb-4">Ready to Get Started${locationText}?</h2>
            <p class="text-xl mb-8 max-w-2xl mx-auto">Get a free quote on your custom metal building. Free delivery and installation included.</p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="${prefix}sheds-for-sale.html" class="bg-white text-secondary px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-gray-100 transition">
                    <i class="fa-solid fa-cube mr-2"></i>Design in 3D
                </a>
                <a href="tel:${business.phoneLink}" class="bg-primary hover:bg-gray-800 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl transition">
                    <i class="fa-solid fa-phone mr-2"></i>${business.phone}
                </a>
            </div>
        </div>
    </section>`;
}

// Generate County Page
function generateCountyPage(county) {
  const title = `Metal Buildings in ${county.name}, FL | ${business.name}`;
  const description = `Custom metal carports, garages, and barns in ${county.name}, Florida. Free delivery & installation in ${county.towns.map(t => t.name).join(', ')}. Call ${business.phone}`;

  const townLinks = county.towns.map(town => `
                <a href="${county.slug}/${town.slug}.html" class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition group">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-white transition">
                            <i class="fa-solid fa-location-dot text-xl"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-lg">${town.name}</h3>
                            <p class="text-gray-500 text-sm">${town.isCountySeat ? 'County Seat' : 'Metal Buildings Available'}</p>
                        </div>
                        <i class="fa-solid fa-arrow-right ml-auto text-gray-400 group-hover:text-secondary transition"></i>
                    </div>
                </a>`).join('\n');

  const serviceCards = services.map(service => `
                <a href="../services/${service.slug}/${county.slug}.html" class="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition group">
                    <div class="p-6">
                        <div class="w-14 h-14 bg-secondary/10 rounded-full flex items-center justify-center text-secondary mb-4 group-hover:bg-secondary group-hover:text-white transition">
                            <i class="fa-solid ${service.icon} text-2xl"></i>
                        </div>
                        <h3 class="font-bold text-xl mb-2">${service.name}</h3>
                        <p class="text-gray-600 text-sm mb-4">${service.description}</p>
                        <span class="text-secondary font-semibold">View in ${county.name} <i class="fa-solid fa-arrow-right ml-1"></i></span>
                    </div>
                </a>`).join('\n');

  return `${generateHead(title, description, `https://nflbuildingsolutions.com/locations/${county.slug}.html`)}
${generateNav(1)}

    <!-- Hero -->
    <section class="bg-primary text-white py-16">
        <div class="container mx-auto px-6">
            <nav class="text-sm mb-4 text-gray-400">
                <a href="../index.html" class="hover:text-white">Home</a> /
                <a href="../locations.html" class="hover:text-white">Service Areas</a> /
                <span class="text-white">${county.name}</span>
            </nav>
            <h1 class="text-4xl md:text-5xl font-bold mb-4">Metal Buildings in ${county.name}, Florida</h1>
            <p class="text-xl text-gray-300 max-w-3xl">${county.description}</p>
        </div>
    </section>

    <!-- Trust Bar -->
    <section class="bg-white py-6 border-b">
        <div class="container mx-auto px-6">
            <div class="flex flex-wrap justify-center items-center gap-8 md:gap-16 text-center">
                <div><div class="text-2xl font-bold text-primary">FREE</div><div class="text-sm text-gray-500">Delivery</div></div>
                <div><div class="text-2xl font-bold text-primary">FREE</div><div class="text-sm text-gray-500">Installation</div></div>
                <div><div class="text-2xl font-bold text-primary">10-Year</div><div class="text-sm text-gray-500">Warranty</div></div>
                <div><div class="text-2xl font-bold text-secondary">10%</div><div class="text-sm text-gray-500">Down Payment</div></div>
            </div>
        </div>
    </section>

    <!-- Towns Section -->
    <section class="py-16 bg-gray-50">
        <div class="container mx-auto px-6">
            <h2 class="text-3xl font-bold text-center mb-4">Cities & Towns We Serve in ${county.name}</h2>
            <p class="text-gray-600 text-center mb-12">Click on your city to see available metal buildings</p>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
${townLinks}
            </div>
        </div>
    </section>

    <!-- Services Section -->
    <section class="py-16 bg-white">
        <div class="container mx-auto px-6">
            <h2 class="text-3xl font-bold text-center mb-4">Our Services in ${county.name}</h2>
            <p class="text-gray-600 text-center mb-12">Quality metal buildings delivered and installed throughout ${county.name}</p>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
${serviceCards}
            </div>
        </div>
    </section>

${generateCTA(county.name, 1)}
${generateFooter(1)}`;
}

// Generate Town Page
function generateTownPage(county, town) {
  const title = `Metal Buildings in ${town.name}, FL | Carports, Garages & Barns | ${business.name}`;
  const description = `Custom metal carports, garages, barns in ${town.name}, ${county.name} FL. Free delivery & installation. 10-year warranty. Call ${business.phone} for a free quote.`;

  const townPrefix = '../../';
  const serviceCards = services.map(service => `
                <div class="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition">
                    <div class="p-6">
                        <div class="w-14 h-14 bg-secondary/10 rounded-full flex items-center justify-center text-secondary mb-4">
                            <i class="fa-solid ${service.icon} text-2xl"></i>
                        </div>
                        <h3 class="font-bold text-xl mb-2">${service.name} in ${town.name}</h3>
                        <p class="text-gray-600 text-sm mb-4">${service.description}</p>
                        <ul class="text-sm text-gray-500 space-y-2 mb-6">
                            ${service.features.map(f => `<li><i class="fa-solid fa-check text-accent mr-2"></i>${f}</li>`).join('\n                            ')}
                        </ul>
                        <a href="${townPrefix}sheds-for-sale.html" class="block w-full bg-secondary hover:bg-blue-700 text-white text-center py-3 rounded-lg font-semibold transition">
                            Design Your ${service.shortName}
                        </a>
                    </div>
                </div>`).join('\n');

  const nearbyTowns = county.towns.filter(t => t.slug !== town.slug).slice(0, 5);
  const nearbyLinks = nearbyTowns.map(t => `
                    <a href="${t.slug}.html" class="hover:text-secondary transition">${t.name}</a>`).join(' · ');

  return `${generateHead(title, description, `https://nflbuildingsolutions.com/locations/${county.slug}/${town.slug}.html`)}
${generateNav(2)}

    <!-- Hero -->
    <section class="bg-primary text-white py-16">
        <div class="container mx-auto px-6">
            <nav class="text-sm mb-4 text-gray-400">
                <a href="../../index.html" class="hover:text-white">Home</a> /
                <a href="../../locations.html" class="hover:text-white">Service Areas</a> /
                <a href="../${county.slug}.html" class="hover:text-white">${county.name}</a> /
                <span class="text-white">${town.name}</span>
            </nav>
            <h1 class="text-4xl md:text-5xl font-bold mb-4">Metal Buildings in ${town.name}, Florida</h1>
            <p class="text-xl text-gray-300 max-w-3xl">Custom carports, garages, and barns delivered and installed in ${town.name}, ${county.name}. Free delivery. Free installation. Financing available.</p>
            <div class="mt-8 flex flex-wrap gap-4">
                <a href="${townPrefix}sheds-for-sale.html" class="bg-secondary hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold shadow-xl transition">
                    <i class="fa-solid fa-cube mr-2"></i>Design Your Building
                </a>
                <a href="tel:${business.phoneLink}" class="bg-white hover:bg-gray-100 text-primary px-8 py-4 rounded-xl font-bold shadow-xl transition">
                    <i class="fa-solid fa-phone mr-2"></i>${business.phone}
                </a>
            </div>
        </div>
    </section>

    <!-- Trust Bar -->
    <section class="bg-white py-6 border-b">
        <div class="container mx-auto px-6">
            <div class="flex flex-wrap justify-center items-center gap-6 md:gap-12 text-center text-sm">
                <span><i class="fa-solid fa-truck text-secondary mr-2"></i>Free Delivery to ${town.name}</span>
                <span><i class="fa-solid fa-tools text-secondary mr-2"></i>Free Installation</span>
                <span><i class="fa-solid fa-shield-halved text-secondary mr-2"></i>10-Year Warranty</span>
                <span><i class="fa-solid fa-dollar-sign text-secondary mr-2"></i>Financing Available</span>
            </div>
        </div>
    </section>

    <!-- Services -->
    <section class="py-16 bg-gray-50">
        <div class="container mx-auto px-6">
            <h2 class="text-3xl font-bold text-center mb-4">Metal Buildings Available in ${town.name}</h2>
            <p class="text-gray-600 text-center mb-12">Choose from our selection of quality steel structures</p>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
${serviceCards}
            </div>
        </div>
    </section>

    <!-- Why Choose Us -->
    <section class="py-16 bg-white">
        <div class="container mx-auto px-6">
            <h2 class="text-3xl font-bold text-center mb-12">Why ${town.name} Chooses Us</h2>
            <div class="grid md:grid-cols-4 gap-8 text-center">
                <div>
                    <div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><i class="fa-solid fa-map-marker-alt"></i></div>
                    <h3 class="font-bold mb-2">Local Service</h3>
                    <p class="text-gray-600 text-sm">We know ${county.name} and provide personalized service to ${town.name} residents.</p>
                </div>
                <div>
                    <div class="w-16 h-16 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><i class="fa-solid fa-dollar-sign"></i></div>
                    <h3 class="font-bold mb-2">Best Prices</h3>
                    <p class="text-gray-600 text-sm">Competitive pricing with financing options. As low as 10% down.</p>
                </div>
                <div>
                    <div class="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><i class="fa-solid fa-truck"></i></div>
                    <h3 class="font-bold mb-2">Free Delivery</h3>
                    <p class="text-gray-600 text-sm">Free delivery and professional installation to ${town.name}.</p>
                </div>
                <div>
                    <div class="w-16 h-16 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><i class="fa-solid fa-shield-halved"></i></div>
                    <h3 class="font-bold mb-2">10-Year Warranty</h3>
                    <p class="text-gray-600 text-sm">Industry-leading warranty on all structures.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Nearby Areas -->
    <section class="py-12 bg-gray-50 border-t">
        <div class="container mx-auto px-6 text-center">
            <h3 class="font-bold mb-4">Also Serving Nearby Areas in ${county.name}:</h3>
            <p class="text-gray-600">${nearbyLinks}</p>
        </div>
    </section>

${generateCTA(town.name, 2)}
${generateFooter(2)}`;
}

// Generate Service Page
function generateServicePage(service) {
  const prefix = '../';
  const title = `${service.name} | Custom Steel ${service.shortName} | ${business.name}`;
  const description = `${service.description} Free delivery and installation throughout North Florida. Call ${business.phone} for a free quote.`;

  const countyLinks = counties.map(county => `
                <a href="services/${service.slug}/${county.slug}.html" class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition group">
                    <h3 class="font-bold text-lg mb-2">${service.name} in ${county.name}</h3>
                    <p class="text-gray-500 text-sm mb-2">Serving ${county.towns.slice(0, 3).map(t => t.name).join(', ')} & more</p>
                    <span class="text-secondary font-semibold text-sm">View Options <i class="fa-solid fa-arrow-right ml-1"></i></span>
                </a>`).join('\n');

  return `${generateHead(title, description, `https://nflbuildingsolutions.com/services/${service.slug}.html`)}
${generateNav(1)}

    <!-- Hero -->
    <section class="bg-primary text-white py-20">
        <div class="container mx-auto px-6">
            <nav class="text-sm mb-4 text-gray-400">
                <a href="../index.html" class="hover:text-white">Home</a> /
                <span class="text-white">${service.name}</span>
            </nav>
            <div class="flex flex-col md:flex-row items-center gap-12">
                <div class="md:w-1/2">
                    <div class="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6">
                        <i class="fa-solid ${service.icon} text-4xl text-white"></i>
                    </div>
                    <h1 class="text-4xl md:text-5xl font-bold mb-4">${service.name}</h1>
                    <p class="text-xl text-gray-300 mb-6">${service.description}</p>
                    <ul class="space-y-3 mb-8">
                        ${service.features.map(f => `<li class="flex items-center gap-3"><i class="fa-solid fa-check text-accent"></i>${f}</li>`).join('\n                        ')}
                    </ul>
                    <div class="flex flex-wrap gap-4">
                        <a href="${prefix}sheds-for-sale.html" class="bg-secondary hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold shadow-xl transition">
                            <i class="fa-solid fa-cube mr-2"></i>Design Yours
                        </a>
                        <a href="tel:${business.phoneLink}" class="bg-white hover:bg-gray-100 text-primary px-8 py-4 rounded-xl font-bold shadow-xl transition">
                            <i class="fa-solid fa-phone mr-2"></i>${business.phone}
                        </a>
                    </div>
                </div>
                <div class="md:w-1/2">
                    <img src="../images/building-1.jpg" alt="${service.name}" class="rounded-2xl shadow-2xl">
                </div>
            </div>
        </div>
    </section>

    <!-- Service Areas -->
    <section class="py-16 bg-gray-50">
        <div class="container mx-auto px-6">
            <h2 class="text-3xl font-bold text-center mb-4">${service.name} By County</h2>
            <p class="text-gray-600 text-center mb-12">Select your county to see availability and get a free quote</p>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
${countyLinks}
            </div>
        </div>
    </section>

${generateCTA('', 1)}
${generateFooter(1)}`;
}

// Generate Service + County Page
function generateServiceCountyPage(service, county) {
  const prefix = '../../';
  const title = `${service.name} in ${county.name}, FL | ${business.name}`;
  const description = `${service.name} delivered and installed in ${county.name}, Florida. Serving ${county.towns.map(t => t.name).join(', ')}. Free delivery. Call ${business.phone}`;

  const townLinks = county.towns.map(town => `
                <a href="../../../locations/${county.slug}/${town.slug}.html" class="text-secondary hover:text-blue-700 transition">${town.name}</a>`).join(' · ');

  return `${generateHead(title, description, `https://nflbuildingsolutions.com/services/${service.slug}/${county.slug}.html`)}
${generateNav(2)}

    <!-- Hero -->
    <section class="bg-primary text-white py-16">
        <div class="container mx-auto px-6">
            <nav class="text-sm mb-4 text-gray-400">
                <a href="../../index.html" class="hover:text-white">Home</a> /
                <a href="../${service.slug}.html" class="hover:text-white">${service.name}</a> /
                <span class="text-white">${county.name}</span>
            </nav>
            <h1 class="text-4xl md:text-5xl font-bold mb-4">${service.name} in ${county.name}, Florida</h1>
            <p class="text-xl text-gray-300 max-w-3xl">${service.description} Free delivery and installation throughout ${county.name}.</p>
            <div class="mt-8 flex flex-wrap gap-4">
                <a href="${prefix}sheds-for-sale.html" class="bg-secondary hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold shadow-xl transition">
                    <i class="fa-solid fa-cube mr-2"></i>Design Your ${service.shortName}
                </a>
                <a href="tel:${business.phoneLink}" class="bg-white hover:bg-gray-100 text-primary px-8 py-4 rounded-xl font-bold shadow-xl transition">
                    <i class="fa-solid fa-phone mr-2"></i>${business.phone}
                </a>
            </div>
        </div>
    </section>

    <!-- Features -->
    <section class="py-16 bg-white">
        <div class="container mx-auto px-6">
            <h2 class="text-3xl font-bold text-center mb-12">${service.name} Features</h2>
            <div class="grid md:grid-cols-4 gap-6">
                ${service.features.map(f => `
                <div class="text-center p-6 bg-gray-50 rounded-xl">
                    <i class="fa-solid fa-check-circle text-3xl text-accent mb-4"></i>
                    <p class="font-semibold">${f}</p>
                </div>`).join('')}
            </div>
        </div>
    </section>

    <!-- Towns Served -->
    <section class="py-16 bg-gray-50">
        <div class="container mx-auto px-6 text-center">
            <h2 class="text-3xl font-bold mb-4">${service.name} Delivered To:</h2>
            <p class="text-lg text-gray-600 mb-8">Free delivery and installation to all ${county.name} communities</p>
            <p class="text-lg">${townLinks}</p>
        </div>
    </section>

${generateCTA(county.name, 2)}
${generateFooter(2)}`;
}

// Generate main locations page
function generateLocationsPage() {
  const title = `Service Areas | Metal Buildings Throughout North Florida | ${business.name}`;
  const description = `Metal carports, garages and barns delivered throughout North Florida. Serving Bradford, Clay, Alachua, Marion, Lake & Putnam counties. Free delivery & installation.`;

  const countyCards = counties.map(county => `
            <a href="locations/${county.slug}.html" class="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition group">
                <div class="bg-primary p-6">
                    <h3 class="text-2xl font-bold text-white">${county.name}</h3>
                    <p class="text-gray-300">County Seat: ${county.seat}</p>
                </div>
                <div class="p-6">
                    <p class="text-gray-600 mb-4">${county.description}</p>
                    <div class="flex flex-wrap gap-2 mb-4">
                        ${county.towns.slice(0, 4).map(t => `<span class="bg-gray-100 px-3 py-1 rounded-full text-sm">${t.name}</span>`).join('')}
                        ${county.towns.length > 4 ? `<span class="bg-gray-100 px-3 py-1 rounded-full text-sm">+${county.towns.length - 4} more</span>` : ''}
                    </div>
                    <span class="text-secondary font-semibold">View All Towns <i class="fa-solid fa-arrow-right ml-1 group-hover:translate-x-1 transition"></i></span>
                </div>
            </a>`).join('\n');

  return `${generateHead(title, description, 'https://nflbuildingsolutions.com/locations.html')}
${generateNav(0)}

    <!-- Hero -->
    <section class="bg-primary text-white py-16">
        <div class="container mx-auto px-6 text-center">
            <h1 class="text-4xl md:text-5xl font-bold mb-4">Our Service Areas</h1>
            <p class="text-xl text-gray-300 max-w-3xl mx-auto">Quality metal buildings delivered and installed throughout North Florida. Free delivery. Free installation. 10-year warranty.</p>
        </div>
    </section>

    <!-- Counties -->
    <section class="py-16 bg-gray-50">
        <div class="container mx-auto px-6">
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
${countyCards}
            </div>
        </div>
    </section>

${generateCTA('', 0)}
${generateFooter(0)}`;
}

// Build all pages
function build() {
  console.log('Building site...\n');

  // Create directories
  ensureDir('./locations');
  ensureDir('./services');
  counties.forEach(c => {
    ensureDir(`./locations/${c.slug}`);
  });
  services.forEach(s => {
    ensureDir(`./services/${s.slug}`);
  });

  // Generate locations index
  console.log('Creating locations.html');
  fs.writeFileSync('./locations.html', generateLocationsPage());

  // Generate county pages
  counties.forEach(county => {
    console.log(`Creating locations/${county.slug}.html`);
    fs.writeFileSync(`./locations/${county.slug}.html`, generateCountyPage(county));

    // Generate town pages
    county.towns.forEach(town => {
      console.log(`Creating locations/${county.slug}/${town.slug}.html`);
      fs.writeFileSync(`./locations/${county.slug}/${town.slug}.html`, generateTownPage(county, town));
    });
  });

  // Generate service pages
  services.forEach(service => {
    console.log(`Creating services/${service.slug}.html`);
    fs.writeFileSync(`./services/${service.slug}.html`, generateServicePage(service));

    // Generate service + county pages
    counties.forEach(county => {
      console.log(`Creating services/${service.slug}/${county.slug}.html`);
      fs.writeFileSync(`./services/${service.slug}/${county.slug}.html`, generateServiceCountyPage(service, county));
    });
  });

  // Count pages
  let pageCount = 1; // locations.html
  pageCount += counties.length; // county pages
  pageCount += counties.reduce((sum, c) => sum + c.towns.length, 0); // town pages
  pageCount += services.length; // service pages
  pageCount += services.length * counties.length; // service + county pages

  console.log(`\n✓ Built ${pageCount} pages successfully!`);
}

build();
