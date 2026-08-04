import { NextResponse } from 'next/server';
import { isDbConfigured, fetchUserContacts, addUserContact, deleteUserContact, getAuthenticatedUserId } from '@/lib/db';

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId(request);

  if (!userId) {
    return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 });
  }

  if (isDbConfigured) {
    const dbContacts = await fetchUserContacts(userId);
    return NextResponse.json({ contacts: dbContacts });
  }

  return NextResponse.json({ contacts: [] });
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, notifyByEmail } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Le nom du proche est requis.' }, { status: 400 });
    }

    if (isDbConfigured) {
      const dbContact = await addUserContact(userId, { name, email, phone, notifyByEmail });
      if (dbContact) {
        return NextResponse.json({ success: true, contact: dbContact });
      } else {
        return NextResponse.json({
          error: "La table 'emergency_contacts' n'est pas encore créée. Veuillez exécuter le script SQL (schema.sql) sur votre base Postgres."
        }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Erreur lors de l\'ajout du contact' }, { status: 500 });
  } catch (error: any) {
    console.error('Error adding contact:', error);
    return NextResponse.json({ error: error?.message || 'Failed to add contact' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getAuthenticatedUserId(request);

    if (!userId) {
      return NextResponse.json({ error: 'Utilisateur non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de contact requis.' }, { status: 400 });
    }

    if (isDbConfigured) {
      const success = await deleteUserContact(id, userId);
      return NextResponse.json({ success });
    }

    return NextResponse.json({ success: false });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
}
