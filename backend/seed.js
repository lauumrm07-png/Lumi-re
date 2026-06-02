const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Artwork = require('./models/Artwork');
const Mentorship = require('./models/Mentorship');
const Availability = require('./models/Availability');
const Booking = require('./models/Booking');
const Review = require('./models/Review');
const Notification = require('./models/Notification');
const connectDB = require('./config/db');

const galleryData = [
  { src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop&crop=entropy&cs=tinysrgb', titulo: 'Ecos del Silencio', desc: 'Una historia capturada entre sombras y luz, donde el silencio habla más que mil palabras.', cat: 'Paisaje' },
  { src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2070&auto=format&fit=crop&crop=entropy&cs=tinysrgb', titulo: 'Nostalgia Urbana', desc: 'Calles vacías donde aún viven recuerdos susurrados entre las estructuras de hormigón.', cat: 'Urbano' },
  { src: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2070&auto=format&fit=crop&crop=entropy&cs=tinysrgb', titulo: 'Reflejos del Alma', desc: 'La luz encuentra su camino a través de los reflejos de un mundo interior.', cat: 'Arte Visual' },
  { src: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?q=80&w=2070&auto=format&fit=crop&crop=entropy&cs=tinysrgb', titulo: 'Geometría Divina', desc: 'Formas perfectas que emergen de la naturaleza, puro equilibrio visual.', cat: 'Abstracto' },
  { src: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop&crop=entropy&cs=tinysrgb', titulo: 'Horizonte Infinito', desc: 'Donde el cielo y la tierra se abrazan en un momento eterno.', cat: 'Paisaje' },
  { src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2070&auto=format&fit=crop&crop=entropy&cs=tinysrgb', titulo: 'Danza de Colores', desc: 'Vibraciones cromáticas que crean una sinfonía visual incomparable.', cat: 'Naturaleza' },
  { src: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2070&auto=format&fit=crop&crop=entropy&cs=tinysrgb', titulo: 'Horizonte Azul', desc: 'La tierra vista desde lo alto, un recordatorio de nuestra pequeña existencia.', cat: 'Paisaje' },
  { src: 'https://images.unsplash.com/photo-1504898770365-14faca6a7320?q=80&w=2070&auto=format&fit=crop&crop=entropy&cs=tinysrgb', titulo: 'Cumbres Eternas', desc: 'Picos que desafían el cielo, donde el viento cuenta historias milenarias.', cat: 'Paisaje' },
  { src: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=2070&auto=format&fit=crop&crop=entropy&cs=tinysrgb', titulo: 'Flujo Natural', desc: 'El agua encuentra su camino, tallando la piedra con paciencia infinita.', cat: 'Naturaleza' },
  { src: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=2070&auto=format&fit=crop&crop=entropy&cs=tinysrgb', titulo: 'Luces de la Ciudad', desc: 'El latido urbano se enciende cuando el sol se despide en el horizonte.', cat: 'Urbano' },
  { src: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop&crop=entropy&cs=tinysrgb', titulo: 'La Gran Travesía', desc: 'Montañas que guardan secretos bajo el manto de nubes y silencio.', cat: 'Paisaje' },
  { src: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2070&auto=format&fit=crop&crop=entropy&cs=tinysrgb', titulo: 'Amanecer Dorado', desc: 'Los primeros rayos de luz pintan el mundo con tonos de esperanza.', cat: 'Paisaje' },
];

const mentorshipData = [
  { name: 'Alex Rivera', email: 'alex@lumina.com', bio: 'Fotógrafo de vida salvaje especializado en grandes felinos. Cada sesión es una expedición donde la paciencia captura lo indómito.', src: 'https://images.unsplash.com/photo-1492254776308-d1fc1f3fd6f3?q=80&w=900&auto=format&fit=crop&crop=entropy&cs=tinysrgb', category: 'Fauna Salvaje', description: 'Fotógrafo de vida salvaje especializado en grandes felinos. Cada sesión es una expedición donde la paciencia captura lo indómito.', price: 65, duration: 60, skills: ['Fauna', 'Composición', 'Paciencia'], avail: [{ day: 1, start: '09:00', end: '13:00' }, { day: 3, start: '10:00', end: '16:00' }, { day: 5, start: '09:00', end: '14:00' }] },
  { name: 'Maria Santos', email: 'maria@lumina.com', bio: 'Exploradora de hábitats naturales. Sus mentorías transforman la observación en imágenes que cuentan historias del mundo animal.', src: 'https://images.unsplash.com/photo-1583303201871-4ca7ace011e1?q=80&w=900&auto=format&fit=crop&crop=entropy&cs=tinysrgb', category: 'Naturaleza Salvaje', description: 'Exploradora de hábitats naturales. Sus mentorías transforman la observación en imágenes que cuentan historias del mundo animal.', price: 60, duration: 60, skills: ['Observación', 'Iluminación', 'Etología'], avail: [{ day: 2, start: '08:00', end: '12:00' }, { day: 4, start: '10:00', end: '17:00' }] },
  { name: 'Carlos López', email: 'carlos@lumina.com', bio: 'Guía de expediciones fotográficas en África. Enseña a capturar la majestuosidad de la fauna en su entorno natural.', src: 'https://images.unsplash.com/photo-1560914186-be9631366bda?q=80&w=900&auto=format&fit=crop&crop=entropy&cs=tinysrgb', category: 'Safari Fotográfico', description: 'Guía de expediciones fotográficas en África. Enseña a capturar la majestuosidad de la fauna en su entorno natural.', price: 70, duration: 60, skills: ['Safari', 'Composición', 'Aventura'], avail: [{ day: 1, start: '09:00', end: '15:00' }, { day: 4, start: '11:00', end: '17:00' }] },
  { name: 'Emma Thompson', email: 'emma@lumina.com', bio: 'Fotógrafa especializada en aves y detalles de la naturaleza. Mentoría en captura de movimiento y técnicas de acercamiento.', src: 'https://images.unsplash.com/photo-1417104293132-707974cc11d3?q=80&w=900&auto=format&fit=crop&crop=entropy&cs=tinysrgb', category: 'Aves y Macro', description: 'Fotógrafa especializada en aves y detalles de la naturaleza. Mentoría en captura de movimiento y técnicas de acercamiento.', price: 55, duration: 60, skills: ['Aves', 'Macro', 'Movimiento'], avail: [{ day: 2, start: '09:00', end: '14:00' }, { day: 5, start: '10:00', end: '16:00' }] },
  { name: 'David Kim', email: 'david@lumina.com', bio: 'Especialista en fotografía de acción y comportamiento animal. Domina la velocidad, el enfoque y la narrativa visual.', src: 'https://images.unsplash.com/photo-1554287240-848498a09b4e?q=80&w=900&auto=format&fit=crop&crop=entropy&cs=tinysrgb', category: 'Animales en Acción', description: 'Especialista en fotografía de acción y comportamiento animal. Domina la velocidad, el enfoque y la narrativa visual.', price: 60, duration: 60, skills: ['Acción', 'Enfoque', 'Narrativa'], avail: [{ day: 3, start: '08:00', end: '14:00' }, { day: 5, start: '09:00', end: '12:00' }] },
  { name: 'Sofía Gómez', email: 'sofia@lumina.com', bio: 'Fotógrafa documental de naturaleza que enseña el arte del storytelling visual en el reino animal con mirada poética.', src: 'https://images.unsplash.com/photo-1584551882441-aa97befd2c59?q=80&w=900&auto=format&fit=crop&crop=entropy&cs=tinysrgb', category: 'Arte Natural', description: 'Fotógrafa documental de naturaleza que enseña el arte del storytelling visual en el reino animal con mirada poética.', price: 65, duration: 60, skills: ['Storytelling', 'Naturaleza', 'Poética Visual'], avail: [{ day: 1, start: '10:00', end: '16:00' }, { day: 4, start: '09:00', end: '13:00' }] },
];

const seed = async () => {
  await connectDB();

  // Clear all
  await Promise.all([
    User.deleteMany({}),
    Artwork.deleteMany({}),
    Mentorship.deleteMany({}),
    Availability.deleteMany({}),
    Booking.deleteMany({}),
    Review.deleteMany({}),
  ]);

  // Create main gallery artist
  const galleryArtist = await User.create({
    name: 'Elena Castillo',
    email: 'elena@lumina.com',
    password: '123456',
    role: 'artist',
    bio: 'Fotógrafa documental apasionada por capturar emociones humanas a través de paisajes urbanos y escenas cotidianas.',
    specialties: ['Documental', 'Urbano', 'Retrato'],
  });

  // Create all gallery artworks under Elena
  await Artwork.create(galleryData.map((g, i) => ({
    artist: galleryArtist._id,
    title: g.titulo,
    description: g.desc,
    image: g.src,
    category: g.cat,
    tags: [g.cat.toLowerCase()],
    featured: i < 4,
    views: Math.floor(Math.random() * 200) + 50,
  })));

  await User.findByIdAndUpdate(galleryArtist._id, { $set: { 'stats.artworks': galleryData.length } });

  // Set availability for Elena
  await Availability.create({
    mentor: galleryArtist._id,
    slots: [
      { day: 1, start: '10:00', end: '16:00' },
      { day: 3, start: '11:00', end: '15:00' },
      { day: 5, start: '10:00', end: '14:00' },
    ],
  });

  console.log('✓ Elena Castillo + 12 obras');

  const createdMentorships = [];

  // Create mentorship artists & their data
  for (const m of mentorshipData) {
    const user = await User.create({
      name: m.name,
      email: m.email,
      password: '123456',
      role: 'artist',
      bio: m.bio,
      specialties: [m.category],
    });

    const mentorship = await Mentorship.create({
      mentor: user._id,
      title: m.category,
      description: m.description,
      category: m.category,
      price: m.price,
      duration: m.duration,
      skills: m.skills,
      image: m.src,
    });
    createdMentorships.push(mentorship);

    await User.findByIdAndUpdate(user._id, { $inc: { 'stats.mentorships': 1 } });

    await Availability.create({
      mentor: user._id,
      slots: m.avail,
    });

    console.log(`✓ ${m.name}`);
  }

  // Create admin
  await User.create({
    name: 'Admin',
    email: 'admin@lumina.com',
    password: 'admin123',
    role: 'admin',
    bio: 'Platform administrator',
  });

  // Create test student
  const testStudent = await User.create({
    name: 'Test Student',
    email: 'student@lumina.com',
    password: '123456',
    role: 'student',
    bio: 'Aprendiz de fotografía',
  });

  // Create completed bookings & sample reviews
  const reviewData = [
    { idx: 0, rating: 5, comment: 'Increíble experiencia. Alex tiene un ojo único para capturar la esencia de los felinos. Aprendí muchísimo sobre composición y paciencia en el campo.' },
    { idx: 1, rating: 4, comment: 'Maria es una guía excepcional. Sus conocimientos sobre hábitats naturales transformaron mi forma de observar. Muy recomendada.' },
    { idx: 2, rating: 5, comment: 'Carlos me llevó en una expedición virtual inolvidable. Su pasión por la fauna africana es contagiosa. Las técnicas de safari son impecables.' },
    { idx: 3, rating: 4, comment: 'Emma tiene una paciencia infinita con aves y macro. Sus tips de acercamiento cambiaron mi fotografía de naturaleza por completo.' },
    { idx: 4, rating: 5, comment: 'David es un maestro de la velocidad. Sus técnicas para capturar animales en movimiento son revolucionarias. Aprendí a anticipar el comportamiento animal.' },
    { idx: 5, rating: 4, comment: 'Sofía tiene una mirada poética única. Su enfoque en storytelling visual transformó mi forma de fotografiar naturaleza. Muy inspiradora.' },
  ];

  for (const r of reviewData) {
    const mentorship = createdMentorships[r.idx];
    const studentId = testStudent._id;
    const mentorId = mentorship.mentor;
    const studentName = 'Lucas';

    await Booking.create({
      student: studentId,
      mentor: mentorId,
      mentorship: mentorship._id,
      amount: mentorship.price,
      currency: 'usd',
      status: 'completed',
      stripeSessionId: `seed_${Date.now()}_${r.idx}`,
    });

    await Review.create({
      mentorship: mentorship._id,
      student: studentId,
      rating: r.rating,
      comment: r.comment,
    });

    await User.findByIdAndUpdate(mentorId, { $inc: { 'stats.students': 1 } });

    // Notificación de reseña
    await Notification.create({
      user: mentorId,
      type: 'review',
      message: `${studentName} te dejó una reseña de ${r.rating} ⭐`,
      read: false,
    });
  }

  // Notificaciones de booking para mentores
  const allMentors = await User.find({ role: 'artist' });
  for (const mentor of allMentors) {
    await Notification.create({
      user: mentor._id,
      type: 'booking',
      message: '¡Nueva reserva completada! Revisá tu dashboard.',
      link: '/dashboard.html',
      read: false,
    });
  }

  console.log('\n✓ Seed complete!');
  console.log('\nCuentas:');
  console.log('  admin@lumina.com / admin123  (admin)');
  console.log('  elena@lumina.com / 123456  (artista galería)');
  mentorshipData.forEach(m => console.log(`  ${m.email} / 123456  (${m.name})`));
  console.log('  student@lumina.com / 123456  (estudiante)');

  process.exit(0);
};

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
