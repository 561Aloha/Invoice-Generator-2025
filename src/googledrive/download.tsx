// googleDrive.ts - Google Drive API Integration

interface GoogleDriveFile {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink: string;
}

export class GoogleDriveService {
  private static accessToken: string | null = null;
  private static readonly CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  private static readonly API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
  private static readonly SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly';
  // Initialize Google Drive API
  static async initialize(): Promise<void> {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        (window as any).gapi.load('client:auth2', async () => {
          await (window as any).gapi.client.init({
            apiKey: this.API_KEY,
            clientId: this.CLIENT_ID,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            scope: this.SCOPES,
          });
          resolve();
        });
      };
      document.body.appendChild(script);
    });
  }

  // Sign in to Google
  static async signIn(): Promise<boolean> {
    try {
      const authInstance = (window as any).gapi.auth2.getAuthInstance();
      const user = await authInstance.signIn();
      const authResponse = user.getAuthResponse();
      this.accessToken = authResponse.access_token;
      return true;
    } catch (error) {
      console.error('Google sign-in error:', error);
      return false;
    }
  }

  // Check if user is signed in
  static isSignedIn(): boolean {
    const authInstance = (window as any).gapi?.auth2?.getAuthInstance();
    return authInstance?.isSignedIn?.get() || false;
  }

  // Sign out
  static async signOut(): Promise<void> {
    const authInstance = (window as any).gapi.auth2.getAuthInstance();
    await authInstance.signOut();
    this.accessToken = null;
  }

  // Upload PDF to Google Drive
  static async uploadPDF(
    pdfBlob: Blob,
    fileName: string,
    folderId?: string
  ): Promise<GoogleDriveFile | null> {
    if (!this.isSignedIn()) {
      console.error('Not signed in to Google Drive');
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
        throw new Error('Upload failed');
      }

      const file = await response.json();
      return file;
    } catch (error) {
      console.error('Error uploading to Google Drive:', error);
      return null;
    }
  }

  // Create a folder in Google Drive
  static async createFolder(folderName: string): Promise<string | null> {
    if (!this.isSignedIn()) {
      return null;
    }

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
      return folder.id;
    } catch (error) {
      console.error('Error creating folder:', error);
      return null;
    }
  }

  // Get or create "Invoice Proposals" folder
  static async getInvoiceFolder(): Promise<string | null> {
    if (!this.isSignedIn()) {
      return null;
    }

    try {
      // Search for existing folder
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
        return data.files[0].id;
      }

      // Create folder if it doesn't exist
      return await this.createFolder('Invoice Proposals');
    } catch (error) {
      console.error('Error getting invoice folder:', error);
      return null;
    }
  }

  // Add this method to GoogleDriveService class
static async pickFolder(): Promise<string | null> {
  if (!this.isSignedIn()) {
    console.error('❌ Not signed in to Google Drive');
    return null;
  }

  return new Promise((resolve) => {
    // Load the Picker API
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      (window as any).gapi.load('picker', () => {
        const picker = new (window as any).google.picker.PickerBuilder()
          .addView(
            new (window as any).google.picker.DocsView()
              .setIncludeFolders(true)
              .setMimeTypes('application/vnd.google-apps.folder')
              .setSelectFolderEnabled(true)
          )
          .setOAuthToken(this.accessToken!)
          .setDeveloperKey(import.meta.env.VITE_GOOGLE_API_KEY) // You'll need to add this
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
      });
    };
    document.body.appendChild(script);
  });
}
}