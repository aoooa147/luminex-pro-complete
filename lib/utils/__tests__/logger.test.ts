import { logger } from '../logger';

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
const mockConsoleDebug = jest.spyOn(console, 'debug').mockImplementation();

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment
    process.env.NODE_ENV = 'development';
    delete process.env.LOG_LEVEL;
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
    mockConsoleWarn.mockRestore();
    mockConsoleDebug.mockRestore();
  });

  describe('info', () => {
    it('should log info messages', () => {
      logger.info('Test message');
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should log info messages with data', () => {
      logger.info('Test message', { key: 'value' });
      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should log info messages with context', () => {
      logger.info('Test message', undefined, 'TestContext');
      expect(mockConsoleLog).toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      logger.warn('Warning message');
      expect(mockConsoleWarn).toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should log error messages', () => {
      logger.error('Error message');
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('should log error objects', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe('debug', () => {
    it('should log debug messages in development', () => {
      process.env.NODE_ENV = 'development';
      logger.debug('Debug message');
      expect(mockConsoleDebug).toHaveBeenCalled();
    });
  });

  describe('success', () => {
    it('should log success messages', () => {
      logger.success('Success message');
      expect(mockConsoleLog).toHaveBeenCalled();
    });
  });

  describe('failure', () => {
    it('should log failure messages', () => {
      logger.failure('Failure message');
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe('log level filtering', () => {
    it('should respect LOG_LEVEL environment variable', () => {
      process.env.LOG_LEVEL = 'error';
      logger.info('This should not log');
      expect(mockConsoleLog).not.toHaveBeenCalled();
      
      logger.error('This should log');
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });
});

