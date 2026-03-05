try {
    require('./screens/LoginScreen');
    console.log('LoginScreen OK');
} catch (e) { console.error('LoginScreen Failed', e); }

try {
    require('./screens/RegisterScreen');
    console.log('RegisterScreen OK');
} catch (e) { console.error('RegisterScreen Failed', e); }

try {
    require('./screens/MapScreen');
    console.log('MapScreen OK');
} catch (e) { console.error('MapScreen Failed', e); }

try {
    require('./screens/TaxisScreen');
    console.log('TaxisScreen OK');
} catch (e) { console.error('TaxisScreen Failed', e); }

try {
    require('./screens/BusRoutesScreen');
    console.log('BusRoutesScreen OK');
} catch (e) { console.error('BusRoutesScreen Failed', e); }

try {
    require('./screens/DriverDashboardScreen');
    console.log('DriverDashboardScreen OK');
} catch (e) { console.error('DriverDashboardScreen Failed', e); }

try {
    require('./screens/MijnRittenScreen');
    console.log('MijnRittenScreen OK');
} catch (e) { console.error('MijnRittenScreen Failed', e); }

try {
    require('./screens/ActiveRideScreen');
    console.log('ActiveRideScreen OK');
} catch (e) { console.error('ActiveRideScreen Failed', e); }
