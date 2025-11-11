require('dotenv').config();
const fetch = globalThis.fetch || require('node-fetch');

const RENIEC_URL = process.env.RENIEC_URL || null;
const RENIEC_API_KEY = process.env.RENIEC_API_KEY || null;

const mockLookup = async (dni) => {
  return {
    dni,
    name: `NombreMock ${dni.slice(-4)}`,
    last_names: 'ApellidoMock',
    full_name: `NombreMock ${dni.slice(-4)} ApellidoMock`,
    address: null
  };
};

async function lookupByDNI(dni) {
  if (!dni) return null;
  if (!RENIEC_URL || process.env.NODE_ENV === 'development') return mockLookup(dni);

  try {
    const url = `${RENIEC_URL}?dni=${encodeURIComponent(dni)}`;
    const res = await fetch(url, {
      headers: { 'Authorization': RENIEC_API_KEY ? `Bearer ${RENIEC_API_KEY}` : '' }
    });
    if (!res.ok) return mockLookup(dni);
    const data = await res.json();
    return {
      dni,
      name: data.nombres || data.name || '',
      last_names: `${data.apellido_paterno || ''} ${data.apellido_materno || ''}`.trim(),
      full_name: data.nombre_completo || `${data.nombres || ''} ${data.apellido_paterno || ''}`.trim(),
      address: data.direccion || null
    };
  } catch (err) {
    return mockLookup(dni);
  }
}

module.exports = { lookupByDNI };
