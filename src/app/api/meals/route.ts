import { NextRequest, NextResponse } from 'next/server';
import { getAllMealLogs, getMealLogsByDateRange, addMealLog, deleteMealLog } from '@/lib/db';
import { MealLog } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let meals: MealLog[];
    if (startDate && endDate) {
      meals = await getMealLogsByDateRange(startDate, endDate);
    } else {
      meals = await getAllMealLogs();
    }

    return NextResponse.json(meals);
  } catch (error) {
    console.error('Error fetching meals:', error);
    return NextResponse.json({ error: 'Failed to fetch meals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipeId, date, mealType, notes } = body;

    if (!recipeId || !date || !mealType) {
      return NextResponse.json(
        { error: 'recipeId, date, and mealType are required' },
        { status: 400 }
      );
    }

    const log: MealLog = {
      id: uuidv4(),
      recipeId,
      date,
      mealType,
      notes,
      createdAt: new Date().toISOString(),
    };

    await addMealLog(log);
    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error('Error adding meal log:', error);
    return NextResponse.json({ error: 'Failed to add meal log' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Meal log ID is required' }, { status: 400 });
    }

    const deleted = await deleteMealLog(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Meal log not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting meal log:', error);
    return NextResponse.json({ error: 'Failed to delete meal log' }, { status: 500 });
  }
}
