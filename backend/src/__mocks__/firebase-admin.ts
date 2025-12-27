export const verifyIdTokenMock = jest.fn(async (token: string) => ({
  uid: "test-user",
  token
}));

export const auth = jest.fn(() => ({
  verifyIdToken: verifyIdTokenMock
}));

export const initializeApp = jest.fn(() => ({}));

export const apps: unknown[] = [];

export const credential = {
  cert: jest.fn(() => ({})),
  applicationDefault: jest.fn(() => ({}))
};

export const firestore = jest.fn(() => ({
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn()
    }))
  }))
}));

const admin = {
  apps,
  initializeApp,
  auth,
  credential,
  firestore
};

export default admin;
