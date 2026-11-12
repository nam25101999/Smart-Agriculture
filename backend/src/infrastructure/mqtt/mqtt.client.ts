import mqtt, { MqttClient } from 'mqtt';
import { env } from '../../shared/config/env.js';
import { logger } from '../../shared/logger/index.js';

export class MqttBrokerService {
  private static instance: MqttBrokerService;
  private client: MqttClient | null = null;
  private isConnecting = false;

  private constructor() {}

  public static getInstance(): MqttBrokerService {
    if (!MqttBrokerService.instance) {
      MqttBrokerService.instance = new MqttBrokerService();
    }
    return MqttBrokerService.instance;
  }

  public connect(): MqttClient {
    if (this.client && this.client.connected) {
      return this.client;
    }

    if (this.isConnecting && this.client) {
      return this.client;
    }

    this.isConnecting = true;
    const clientId = `${env.MQTT_CLIENT_PREFIX}_${Math.random().toString(16).substring(2, 10)}`;

    logger.info({ brokerUrl: env.MQTT_BROKER_URL, clientId }, 'Connecting to EMQX MQTT Broker...');

    this.client = mqtt.connect(env.MQTT_BROKER_URL, {
      clientId,
      username: env.MQTT_USERNAME || undefined,
      password: env.MQTT_PASSWORD || undefined,
      clean: true,
      reconnectPeriod: 3000,
      connectTimeout: 10000,
      keepalive: 60,
    });

    this.client.on('connect', () => {
      this.isConnecting = false;
      logger.info('✓ Connected to EMQX MQTT Broker successfully');
    });

    this.client.on('error', (err) => {
      this.isConnecting = false;
      logger.error(err, 'MQTT Client encountered an error');
    });

    this.client.on('offline', () => {
      logger.warn('MQTT Client went offline');
    });

    this.client.on('reconnect', () => {
      logger.info('Reconnecting to MQTT Broker...');
    });

    return this.client;
  }

  public getClient(): MqttClient {
    if (!this.client) {
      return this.connect();
    }
    return this.client;
  }

  public publish(topic: string, message: string | object, qos: 0 | 1 | 2 = 1): Promise<void> {
    const client = this.getClient();
    const payload = typeof message === 'string' ? message : JSON.stringify(message);

    return new Promise((resolve, reject) => {
      client.publish(topic, payload, { qos }, (err) => {
        if (err) {
          logger.error({ err, topic }, 'Failed to publish MQTT message');
          reject(err);
        } else {
          logger.debug({ topic }, 'Published MQTT message');
          resolve();
        }
      });
    });
  }

  public subscribe(topic: string, qos: 0 | 1 | 2 = 1): Promise<void> {
    const client = this.getClient();

    return new Promise((resolve, reject) => {
      client.subscribe(topic, { qos }, (err) => {
        if (err) {
          logger.error({ err, topic }, 'Failed to subscribe to MQTT topic');
          reject(err);
        } else {
          logger.info({ topic }, '✓ Subscribed to MQTT topic');
          resolve();
        }
      });
    });
  }
}

export const mqttService = MqttBrokerService.getInstance();

