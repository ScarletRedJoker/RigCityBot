import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    botName: "Ticket Bot",
    botPrefix: "!",
    discordServerId: "",
    welcomeMessage: "Thank you for creating a ticket. Our support team will assist you shortly.",
    notificationsEnabled: true,
    adminRoleId: "",
    supportRoleId: "",
    autoCloseEnabled: true,
    autoCloseHours: "48",
    debugMode: false
  });
  
  const handleChange = (field: string, value: any) => {
    setSettings({
      ...settings,
      [field]: value
    });
  };
  
  const saveSettings = () => {
    // In a real app, this would send the settings to the server
    console.log("Saving settings:", settings);
    
    toast({
      title: "Settings saved",
      description: "Your settings have been saved successfully.",
    });
  };
  
  return (
    <div className="container py-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="discord">Discord</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        
        {/* General Settings Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure basic bot settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="botName">Bot Name</Label>
                <Input 
                  id="botName" 
                  value={settings.botName} 
                  onChange={(e) => handleChange("botName", e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  The name displayed in the dashboard and notifications
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="botPrefix">Command Prefix</Label>
                <Input 
                  id="botPrefix" 
                  value={settings.botPrefix} 
                  onChange={(e) => handleChange("botPrefix", e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  The prefix used for bot commands (e.g., !ticket)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="welcomeMessage">Welcome Message</Label>
                <Input 
                  id="welcomeMessage" 
                  value={settings.welcomeMessage} 
                  onChange={(e) => handleChange("welcomeMessage", e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  The message sent when a new ticket is created
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="notificationsEnabled" 
                  checked={settings.notificationsEnabled}
                  onCheckedChange={(checked) => handleChange("notificationsEnabled", checked)}
                />
                <Label htmlFor="notificationsEnabled">Enable Notifications</Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveSettings}>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Discord Settings Tab */}
        <TabsContent value="discord">
          <Card>
            <CardHeader>
              <CardTitle>Discord Integration</CardTitle>
              <CardDescription>Configure Discord server settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="discordServerId">Discord Server ID</Label>
                <Input 
                  id="discordServerId" 
                  value={settings.discordServerId} 
                  onChange={(e) => handleChange("discordServerId", e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  The ID of your Discord server
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adminRoleId">Admin Role ID</Label>
                <Input 
                  id="adminRoleId" 
                  value={settings.adminRoleId} 
                  onChange={(e) => handleChange("adminRoleId", e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  The Discord role ID for administrators
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="supportRoleId">Support Role ID</Label>
                <Input 
                  id="supportRoleId" 
                  value={settings.supportRoleId} 
                  onChange={(e) => handleChange("supportRoleId", e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  The Discord role ID for support staff
                </p>
              </div>
              
              <Separator className="my-4" />
              
              <div className="bg-muted p-4 rounded-md">
                <h3 className="font-medium mb-2">Discord Bot Integration</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  To fully integrate with Discord, you need to set the DISCORD_BOT_TOKEN environment variable.
                </p>
                <Button variant="outline">Check Bot Status</Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveSettings}>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Tickets Settings Tab */}
        <TabsContent value="tickets">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Settings</CardTitle>
              <CardDescription>Configure ticket behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="autoCloseEnabled" 
                  checked={settings.autoCloseEnabled}
                  onCheckedChange={(checked) => handleChange("autoCloseEnabled", checked)}
                />
                <Label htmlFor="autoCloseEnabled">Auto-close Inactive Tickets</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="autoCloseHours">Auto-close After (Hours)</Label>
                <Input 
                  id="autoCloseHours" 
                  type="number"
                  value={settings.autoCloseHours} 
                  onChange={(e) => handleChange("autoCloseHours", e.target.value)}
                  disabled={!settings.autoCloseEnabled}
                />
                <p className="text-sm text-muted-foreground">
                  Close tickets automatically after this many hours of inactivity
                </p>
              </div>
              
              <Separator className="my-4" />
              
              <div className="bg-muted p-4 rounded-md">
                <h3 className="font-medium mb-2">Ticket Templates</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create and manage ticket templates for common issue types.
                </p>
                <Button variant="outline">Manage Templates</Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveSettings}>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Advanced Settings Tab */}
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Configuration for advanced users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="debugMode" 
                  checked={settings.debugMode}
                  onCheckedChange={(checked) => handleChange("debugMode", checked)}
                />
                <Label htmlFor="debugMode">Debug Mode</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Enable detailed logging and debug information
              </p>
              
              <Separator className="my-4" />
              
              <div className="bg-muted p-4 rounded-md">
                <h3 className="font-medium mb-2">Database Management</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage application data and perform maintenance tasks.
                </p>
                <div className="flex space-x-2">
                  <Button variant="outline">Export Data</Button>
                  <Button variant="destructive" size="sm">Reset App Data</Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveSettings}>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}