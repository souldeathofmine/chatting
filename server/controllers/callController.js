import { OpenVidu } from 'openvidu-node-client';

const OPENVIDU_URL = process.env.OPENVIDU_URL || 'https://localhost:4443';
const OPENVIDU_SECRET = process.env.OPENVIDU_SECRET || 'MY_SECRET';

const openvidu = new OpenVidu(OPENVIDU_URL, OPENVIDU_SECRET);

export const createSession = async (req, res) => {
  try {
    const { roomName } = req.body;
    if (!roomName) {
      return res.status(400).json({ message: 'roomName is required' });
    }

    const session = await openvidu.createSession({ customSessionId: roomName });
    res.json({ sessionId: session.sessionId });
  } catch (error) {
    if (error.message?.includes('already exists')) {
      return res.json({ sessionId: roomName });
    }
    console.error('OpenVidu create session error:', error);
    res.status(500).json({ message: 'Failed to create session' });
  }
};

export const createToken = async (req, res) => {
  try {
    const { sessionId, data } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId is required' });
    }

    const session = await openvidu.createSession({ customSessionId: sessionId });
    const token = await session.generateToken({
      data: data || '{}',
    });
    res.json({ token });
  } catch (error) {
    console.error('OpenVidu create token error:', error);
    res.status(500).json({ message: 'Failed to create token' });
  }
};
