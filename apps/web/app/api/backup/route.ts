import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createDatabaseBackup, getBackupStatus } from "@/lib/backup"
import { requireOwner } from "@/lib/auth-guard"

export async function GET(req: NextRequest) {
  try {
    const session = await requireOwner()

    const status = await getBackupStatus()
    return NextResponse.json(status)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireOwner()

    const { configId, tables } = await req.json()

    const result = await createDatabaseBackup(configId, tables)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Backup failed' },
      { status: 500 }
    )
  }
}
