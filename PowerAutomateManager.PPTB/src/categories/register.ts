import { registerCategory } from './registry';
import { flowsModule } from '../features/flows/flowsModule';
import { connectionReferencesModule } from '../features/connection-references/connectionReferencesModule';
import { connectionsModule } from '../features/connections/connectionsModule';

// Category modules register here as they are added (features 002-004).
registerCategory(flowsModule);
registerCategory(connectionReferencesModule);
registerCategory(connectionsModule);
