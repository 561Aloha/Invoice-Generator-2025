// googledrive.ts - Google Drive with GIS only (no gapi dependency)

interface GoogleDriveFile {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink: string;
}

export class GoogleDriveService {
  private static accessToken: string | null = null;
  private static readonly CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
 
  private static readonly SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive';
  private static tokenClient: any = null;
  private static gisInited = false;

  // Initialize Google Identity Services (for authentication)
  static async initialize(): Promise<void> {
    if (this.gisInited) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        try {
          this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: this.CLIENT_ID,
            scope: this.SCOPES,
            callback: '', // defined at sign-in time
          });
          this.gisInited = true;
          console.log('✅ Google Identity Services initialized');
          resolve();
        } catch (error) {
          console.error('❌ Failed to initialize GIS:', error);
          reject(error);
        }
      };
      script.onerror = () => reject(new Error('Failed to load GIS'));
      document.body.appendChild(script);
    });
  }
  // Sign in and get access token
static async signIn(): Promise<boolean> {
  try {
    if (!this.gisInited) {
      await this.initialize();
    }

    return new Promise((resolve) => {
      // Set callback for token response
      this.tokenClient.callback = (response: any) => {
        if (response.error) {
          console.error('❌ Token error:', response);
          resolve(false);
          return;
        }
        
        this.accessToken = response.access_token;
        console.log('✅ Successfully signed in to Google Drive');
        console.log('🔑 Token scopes:', response.scope); // ✅ ADD THIS to see what scopes you got
        resolve(true);
      };

      // ✅ CHANGE THIS - Force consent prompt to get new permissions
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  } catch (error) {
    console.error('❌ Sign-in error:', error);
    return false;
  }
}

  // Check if user is signed in
  static isSignedIn(): boolean {
    return !!this.accessToken;
  }

  // Sign out
  static async signOut(): Promise<void> {
    if (this.accessToken) {
      (window as any).google.accounts.oauth2.revoke(this.accessToken, () => {
        console.log('✅ Token revoked');
      });
      this.accessToken = null;
      console.log('✅ Signed out from Google Drive');
    }
  }

  // Upload PDF to Google Drive
  static async uploadPDF(
    pdfBlob: Blob,
    fileName: string,
    folderId?: string
  ): Promise<GoogleDriveFile | null> {
    if (!this.isSignedIn()) {
      console.error('❌ Not signed in to Google Drive');
      return null;
    }

    try {
      const metadata = {
        name: fileName,
        mimeType: 'application/pdf',
        ...(folderId && { parents: [folderId] }),
      };

      const formData = new FormData();
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      formData.append('file', pdfBlob);

      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Upload failed:', errorData);
        throw new Error(`Upload failed: ${response.status}`);
      }

      const file = await response.json();
      console.log('✅ PDF uploaded successfully:', file.name);
      return file;
    } catch (error) {
      console.error('❌ Error uploading to Google Drive:', error);
      return null;
    }
  }

  // Create folder
  static async createFolder(folderName: string): Promise<string | null> {
    if (!this.isSignedIn()) return null;

    try {
      const response = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
        }),
      });

      if (!response.ok) {
        throw new Error('Folder creation failed');
      }

      const folder = await response.json();
      console.log('✅ Folder created:', folderName);
      return folder.id;
    } catch (error) {
      console.error('❌ Error creating folder:', error);
      return null;
    }
  }

  // Get or create invoice folder
  static async getInvoiceFolder(): Promise<string | null> {
    if (!this.isSignedIn()) return null;

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='Invoice Proposals' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      const data = await response.json();
      
      if (data.files && data.files.length > 0) {
        console.log('✅ Found existing Invoice Proposals folder');
        return data.files[0].id;
      }

      console.log('📁 Creating Invoice Proposals folder...');
      return await this.createFolder('Invoice Proposals');
    } catch (error) {
      console.error('❌ Error getting invoice folder:', error);
      return null;
    }
  }
  // Add this method to GoogleDriveService class
// Add this method to your GoogleDriveService class in googledrive.ts

// Add this method to your GoogleDriveService class in googledrive.ts

static async pickFolder(): Promise<string | null> {
  if (!this.isSignedIn()) {
    console.error('❌ Not signed in to Google Drive');
    return null;
  }

  return new Promise((resolve) => {
    // Check if gapi script is already loaded
    const existingScript = document.querySelector('script[src="https://apis.google.com/js/api.js"]');
    
    const loadPicker = () => {
      (window as any).gapi.load('picker', () => {
        try {
          const picker = new (window as any).google.picker.PickerBuilder()
            .addView(
              new (window as any).google.picker.DocsView()
                .setIncludeFolders(true)
                .setMimeTypes('application/vnd.google-apps.folder')
                .setSelectFolderEnabled(true)
            )
            .setOAuthToken(this.accessToken!)
            .setDeveloperKey(import.meta.env.VITE_GOOGLE_API_KEY)
            .setCallback((data: any) => {
              if (data.action === (window as any).google.picker.Action.PICKED) {
                const folderId = data.docs[0].id;
                const folderName = data.docs[0].name;
                console.log('✅ Selected folder:', folderName, folderId);
                resolve(folderId);
              } else if (data.action === (window as any).google.picker.Action.CANCEL) {
                console.log('❌ Folder selection cancelled');
                resolve(null);
              }
            })
            .build();
          
          picker.setVisible(true);
        } catch (error) {
          console.error('❌ Error creating picker:', error);
          resolve(null);
        }
      });
    };

    if (existingScript) {
      // Script already loaded
      loadPicker();
    } else {
      // Load the script
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = loadPicker;
      script.onerror = () => {
        console.error('❌ Failed to load Google Picker API');
        resolve(null);
      };
      document.body.appendChild(script);
    }
  });
}
}