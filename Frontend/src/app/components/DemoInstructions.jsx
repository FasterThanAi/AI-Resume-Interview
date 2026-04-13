// This component can be added to any page to show demo instructions
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Info } from 'lucide-react';

export function DemoInstructions() {
  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Info className="h-5 w-5" />
          Demo Mode Instructions
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-blue-700 space-y-2">
        <p><strong>HR Login:</strong> Use any email and password to access the admin console</p>
        <p><strong>Job Board:</strong> Browse and apply to jobs without login</p>
        <p><strong>Application:</strong> Upload any PDF (AI scoring is simulated)</p>
        <p><strong>Interview:</strong> Click the demo link after applying to test the AI interview room</p>
        <p><strong>Proctoring:</strong> Enable webcam to test face detection and anti-cheat features</p>
      </CardContent>
    </Card>);

}