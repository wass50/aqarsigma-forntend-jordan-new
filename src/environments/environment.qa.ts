export const environment = {
  production: true,
  apiBaseUrl: 'http://aqarsigma-jordan-api-env.eba-k4um8e6r.us-east-2.elasticbeanstalk.com',
  maxListingsPerUser: 3,
  showDetailsInline: false,
  map: {
    tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    defaultCenter: { lat: 31.94412979332786, lng: 35.935268264115564 },
    defaultZoom: 13,
     maxZoom: 18,
    markerIcon: {
      green: 'assets/marker-icon-green.png',
      red: 'assets/marker-icon-red.png',
      gray: 'assets/marker-icon-gray.png',
      shadow: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
    }
  },
  admin: {
    maxUsersPerPage: 50,
    supportEmail: 'support@aqarsigma.com',
    defaultTab: 'dashboard'
  },
   housingCompany: {
    defaultUserRole: 'housing_company',
    defaultUserStatus: 'Pending',
    defaultVerificationStatus: 'pending',
    maxPhotoSizeMB: 5,
    allowedPhotoTypes: ['image/png', 'image/jpeg', 'image/jpg']
  },
  listing: {
    maxPhotos: 10,
    maxPhotoSizeMB: 5,
    allowedPhotoTypes: ['image/png', 'image/jpeg', 'image/jpg'],
    defaultListingStatus: 'Active'
  },
  user: {
    defaultRole: 'user',
    defaultStatus: 'Pending',
    defaultActive: true
  } ,
 auth: {
    loginEndpoint: '/api/auth/login',
    refreshEndpoint: '/api/auth/refresh',
    authStorageKey: 'authToken',
    userStorageKey: 'userProfile',
    loginRedirect: '/user-account',
    sessionTimeoutMin: 60,
    maxLoginAttempts: 5,
    lockDurationMin: 30  // <-- add configurable lock duration (minutes)
  },
  watchlist: {
    maxPropertiesPerList: 10,
    miniMapZoom: 12,
    miniMapAreaZoom: 11,
    defaultCenter: { lat: 31.9516, lng: 35.9237 } // Amman default for mini maps / modals
  },
};