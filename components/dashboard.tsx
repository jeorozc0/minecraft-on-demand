"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Play, Square } from "lucide-react"

type ServerStatus = "offline" | "starting" | "online" | "stopping"

export default function Dashboard() {
  const [version, setVersion] = useState("")
  const [serverType, setServerType] = useState("")
  const [serverStatus, setServerStatus] = useState<ServerStatus>("offline")
  const [isLoading, setIsLoading] = useState(false)

  const handleStartServer = async () => {
    if (!version || !serverType) {
      alert("Please select both version and server type")
      return
    }

    setIsLoading(true)
    setServerStatus("starting")

    setTimeout(() => {
      setServerStatus("online")
      setIsLoading(false)
    }, 3000)
  }

  const handleStopServer = () => {
    setServerStatus("stopping")
    setTimeout(() => {
      setServerStatus("offline")
    }, 2000)
  }

  const getStatusColor = (status: ServerStatus) => {
    switch (status) {
      case "online":
        return "bg-green-500"
      case "starting":
        return "bg-yellow-500"
      case "stopping":
        return "bg-orange-500"
      case "offline":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: ServerStatus) => {
    switch (status) {
      case "online":
        return "Online"
      case "starting":
        return "Starting..."
      case "stopping":
        return "Stopping..."
      case "offline":
        return "Offline"
      default:
        return "Unknown"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Minecraft Server Dashboard</h1>
          <p className="text-gray-600 mt-2">Configure and manage your Minecraft server</p>
        </div>

        {/* Server Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Server Status
              <Badge variant="secondary" className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(serverStatus)}`} />
                {getStatusText(serverStatus)}
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Server Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle>Server Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Minecraft Version</label>
                <Select value={version} onValueChange={setVersion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1.20.4">1.20.4</SelectItem>
                    <SelectItem value="1.20.3">1.20.3</SelectItem>
                    <SelectItem value="1.20.2">1.20.2</SelectItem>
                    <SelectItem value="1.20.1">1.20.1</SelectItem>
                    <SelectItem value="1.19.4">1.19.4</SelectItem>
                    <SelectItem value="1.19.3">1.19.3</SelectItem>
                    <SelectItem value="1.18.2">1.18.2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Server Type</label>
                <Select value={serverType} onValueChange={setServerType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select server type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vanilla">Vanilla</SelectItem>
                    <SelectItem value="paper">Paper</SelectItem>
                    <SelectItem value="spigot">Spigot</SelectItem>
                    <SelectItem value="fabric">Fabric</SelectItem>
                    <SelectItem value="forge">Forge</SelectItem>
                    <SelectItem value="bukkit">Bukkit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              {serverStatus === "offline" ? (
                <Button onClick={handleStartServer} disabled={isLoading} className="flex items-center gap-2">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Start Server
                </Button>
              ) : (
                <Button
                  onClick={handleStopServer}
                  variant="destructive"
                  disabled={serverStatus === "stopping"}
                  className="flex items-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  Stop Server
                </Button>
              )}
            </div>

            {version && serverType && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Selected Configuration:</strong> {serverType} server running Minecraft {version}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Server Info Card (when online) */}
        {serverStatus === "online" && (
          <Card>
            <CardHeader>
              <CardTitle>Server Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Server IP:</span>
                  <p className="text-gray-600">play.yourserver.com</p>
                </div>
                <div>
                  <span className="font-medium">Port:</span>
                  <p className="text-gray-600">25565</p>
                </div>
                <div>
                  <span className="font-medium">Players Online:</span>
                  <p className="text-gray-600">0/20</p>
                </div>
                <div>
                  <span className="font-medium">Uptime:</span>
                  <p className="text-gray-600">Just started</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
