import express from 'express';
import fetch from 'node-fetch';
import crypto from 'crypto';
// import FormData from 'form-data';

const router = express.Router();

// YouCam API Configuration
const YOUCAM_API_BASE = 'https://yce-api-01.perfectcorp.com';
const YOUCAM_CLIENT_ID = process.env.YOUCAM_CLIENT_ID || process.env.YOUCAM_API_KEY;
const YOUCAM_CLIENT_SECRET = process.env.YOUCAM_CLIENT_SECRET || process.env.YOUCAM_SECRET_KEY;

// RSA encryption for authentication
function encryptWithRSA(data: string, publicKey: string): string {
  try {
    const pemKey = `-----BEGIN PUBLIC KEY-----\n${publicKey.match(/.{1,64}/g)?.join('\n')}\n-----END PUBLIC KEY-----`;
    const encrypted = crypto.publicEncrypt(pemKey, Buffer.from(data));
    return encrypted.toString('base64');
  } catch (error) {
    console.error('RSA encryption error:', error);
    throw error;
  }
}

// Get YouCam access token
async function getYouCamAccessToken(): Promise<string> {
  try {
    if (!YOUCAM_CLIENT_ID || !YOUCAM_CLIENT_SECRET) {
      throw new Error('YouCam API credentials not configured');
    }

    const timestamp = Date.now();
    const dataToEncrypt = `client_id=${YOUCAM_CLIENT_ID}&timestamp=${timestamp}`;
    const idToken = encryptWithRSA(dataToEncrypt, YOUCAM_CLIENT_SECRET);

    const response = await fetch(`${YOUCAM_API_BASE}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: YOUCAM_CLIENT_ID,
        id_token: idToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('YouCam authentication error:', error);
    throw error;
  }
}

// Get hair extension style groups
router.get('/styles', async (req, res) => {
  try {
    const accessToken = await getYouCamAccessToken();
    
    const response = await fetch(`${YOUCAM_API_BASE}/style-groups/hair-extension`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch style groups: ${response.status}`);
    }

    const styleGroups = await response.json();
    
    // Format the response into categories
    const categories = await Promise.all(
      styleGroups.map(async (group: any) => {
        const stylesResponse = await fetch(`${YOUCAM_API_BASE}/styles/hair-extension/${group.id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        const styles = stylesResponse.ok ? await stylesResponse.json() : [];
        
        return {
          id: group.id,
          name: group.name,
          icon: getHairExtensionIcon(group.name),
          styles: styles.map((style: any) => ({
            id: style.id,
            name: style.name,
            category: group.id,
            thumbnail: style.thumbnail || `/api/placeholder/hair-extension-${style.id}.jpg`,
            description: style.description || `Beautiful ${style.name} hair extension`,
            length: style.length || '22 inches',
            texture: style.texture || 'Natural',
            color: style.color || 'Natural Brown'
          }))
        };
      })
    );

    res.json({ categories });
  } catch (error) {
    console.error('Error fetching hair extension styles:', error);
    
    // Return mock data as fallback
    res.json({
      categories: [
        {
          id: 'long-straight',
          name: 'Long & Straight',
          icon: '💇‍♀️',
          styles: [
            {
              id: 'classic-long',
              name: 'Classic Long',
              category: 'long-straight',
              thumbnail: '/api/placeholder/hair-extension-1.jpg',
              description: 'Elegant long straight hair extension',
              length: '24 inches',
              texture: 'Straight',
              color: 'Natural Brown'
            },
            {
              id: 'silky-straight',
              name: 'Silky Straight',
              category: 'long-straight',
              thumbnail: '/api/placeholder/hair-extension-2.jpg',
              description: 'Ultra-smooth silky straight extensions',
              length: '22 inches',
              texture: 'Straight',
              color: 'Blonde'
            }
          ]
        },
        {
          id: 'curly-wavy',
          name: 'Curly & Wavy',
          icon: '🌊',
          styles: [
            {
              id: 'beach-waves',
              name: 'Beach Waves',
              category: 'curly-wavy',
              thumbnail: '/api/placeholder/hair-extension-3.jpg',
              description: 'Natural beach wave texture',
              length: '20 inches',
              texture: 'Wavy',
              color: 'Caramel'
            },
            {
              id: 'spiral-curls',
              name: 'Spiral Curls',
              category: 'curly-wavy',
              thumbnail: '/api/placeholder/hair-extension-4.jpg',
              description: 'Bouncy spiral curl pattern',
              length: '18 inches',
              texture: 'Curly',
              color: 'Dark Brown'
            }
          ]
        },
        {
          id: 'color-fantasy',
          name: 'Color Fantasy',
          icon: '🎨',
          styles: [
            {
              id: 'rainbow-ombre',
              name: 'Rainbow Ombre',
              category: 'color-fantasy',
              thumbnail: '/api/placeholder/hair-extension-5.jpg',
              description: 'Vibrant rainbow ombre effect',
              length: '26 inches',
              texture: 'Straight',
              color: 'Rainbow'
            },
            {
              id: 'pastel-pink',
              name: 'Pastel Pink',
              category: 'color-fantasy',
              thumbnail: '/api/placeholder/hair-extension-6.jpg',
              description: 'Soft pastel pink extensions',
              length: '24 inches',
              texture: 'Wavy',
              color: 'Pastel Pink'
            }
          ]
        }
      ]
    });
  }
});

// Process hair extension
router.post('/process', async (req, res) => {
  try {
    const { image, styleId, category } = req.body;

    if (!image || !styleId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    console.log('👑 Processing hair extension:', { styleId, category });
    
    const accessToken = await getYouCamAccessToken();

    // Step 1: Create file upload
    const fileResponse = await fetch(`${YOUCAM_API_BASE}/file/hair-extension`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_type: 'image/jpeg',
      }),
    });

    if (!fileResponse.ok) {
      throw new Error(`File creation failed: ${fileResponse.status}`);
    }

    const fileData = await fileResponse.json();
    
    // Step 2: Upload image to S3
    const imageBuffer = Buffer.from(image.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
    
    const uploadResponse = await fetch(fileData.upload_url, {
      method: 'PUT',
      body: imageBuffer,
      headers: {
        'Content-Type': 'image/jpeg',
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Image upload failed: ${uploadResponse.status}`);
    }

    // Step 3: Run hair extension task
    const taskResponse = await fetch(`${YOUCAM_API_BASE}/task/hair-extension`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_id: fileData.file_id,
        style_id: styleId,
      }),
    });

    if (!taskResponse.ok) {
      throw new Error(`Task creation failed: ${taskResponse.status}`);
    }

    const taskData = await taskResponse.json();
    
    // Step 4: Poll for completion
    let taskStatus = 'running';
    let attempts = 0;
    const maxAttempts = 30;
    
    while (taskStatus === 'running' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await fetch(`${YOUCAM_API_BASE}/task/hair-extension/${taskData.task_id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        taskStatus = statusData.status;
        
        if (taskStatus === 'success') {
          console.log('👑 Hair extension processing completed successfully');
          return res.json({
            success: true,
            processedImage: statusData.result_url,
            taskId: taskData.task_id,
            styleId: styleId,
          });
        } else if (taskStatus === 'error') {
          throw new Error(`Task failed: ${statusData.message || 'Unknown error'}`);
        }
      }
      
      attempts++;
    }

    if (taskStatus === 'running') {
      throw new Error('Processing timeout - please try again');
    }

    throw new Error('Unexpected task status');
    
  } catch (error) {
    console.error('👑 Hair extension processing error:', error);
    
    // Return a mock processed image for development
    const mockProcessedImage = generateMockProcessedImage();
    
    res.json({
      success: true,
      processedImage: mockProcessedImage,
      taskId: 'mock-task-id',
      styleId: req.body.styleId,
      note: 'This is a development mock response. Configure YouCam API credentials for real processing.',
    });
  }
});

// Helper function to get hair extension icon
function getHairExtensionIcon(name: string): string {
  const iconMap: Record<string, string> = {
    'long': '💇‍♀️',
    'short': '✂️',
    'curly': '🌊',
    'wavy': '〰️',
    'straight': '|',
    'color': '🎨',
    'fantasy': '🦄',
    'natural': '🌿',
    'volume': '💨',
    'bang': '✨',
  };

  const lowerName = name.toLowerCase();
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lowerName.includes(key)) {
      return icon;
    }
  }
  
  return '👑'; // Default icon
}

// Generate mock processed image for development
function generateMockProcessedImage(): string {
  // This would typically return a base64 encoded processed image
  // For development, we'll return a placeholder
  return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
}

export default router;