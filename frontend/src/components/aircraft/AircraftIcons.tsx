import { Plane, Helicopter, Rocket, Shield, AlertTriangle, Radio } from 'lucide-react';
import React from 'react';

export const IntakeIcon = () => <Plane className="w-8 h-8 text-blue-400" />;
export const RoutingIcon = () => <Rocket className="w-10 h-10 text-cyan-400" />;
export const SchedulingIcon = () => <Helicopter className="w-8 h-8 text-green-400" />;
export const SecurityIcon = () => <Shield className="w-8 h-8 text-orange-400" />;
export const EscalationIcon = () => <AlertTriangle className="w-10 h-10 text-red-500" />;
export const MemoryIcon = () => <Radio className="w-8 h-8 text-purple-400" />;

export const getIconForAgent = (agentType: string) => {
  switch (agentType) {
    case 'intake': return <IntakeIcon />;
    case 'routing': return <RoutingIcon />;
    case 'scheduling': return <SchedulingIcon />;
    case 'security': return <SecurityIcon />;
    case 'escalation': return <EscalationIcon />;
    case 'memory': return <MemoryIcon />;
    default: return <Plane className="w-8 h-8 text-gray-400" />;
  }
};
