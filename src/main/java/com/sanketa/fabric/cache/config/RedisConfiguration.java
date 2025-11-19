package com.sanketa.fabric.cache.config;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.lettuce.core.ClientOptions;
import io.lettuce.core.SocketOptions;
import io.lettuce.core.TimeoutOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettucePoolingClientConfiguration;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;


@Slf4j
@Configuration
@ConditionalOnProperty(name = "fabric.redis.enabled", havingValue = "true", matchIfMissing = true)
@EnableConfigurationProperties(RedisProperties.class)
public class RedisConfiguration {
    
    private final RedisProperties properties;
    
    public RedisConfiguration(RedisProperties properties) {
        this.properties = properties;
    }
    
    /**
     * Create Redis connection factory
     */
    @Bean
    @Primary
    public RedisConnectionFactory redisConnectionFactory() {
        log.info("Configuring Redis standalone connection");
        
        LettuceClientConfiguration clientConfig = createClientConfiguration();
        return createStandaloneConnectionFactory(clientConfig);
    }
    
    /**
     * Create Redis template with proper serialization
     */
    @Bean
    @Primary
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        
        // Key serializer: String
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        
        // Value serializer: JSON
        RedisSerializer<Object> valueSerializer = createValueSerializer();
        template.setValueSerializer(valueSerializer);
        template.setHashValueSerializer(valueSerializer);
        
        template.setEnableTransactionSupport(false);
        template.afterPropertiesSet();
        
        log.info("Redis template configured with JSON serialization");
        return template;
    }
    
    /**
     * Create standalone connection factory
     */
    private LettuceConnectionFactory createStandaloneConnectionFactory(LettuceClientConfiguration clientConfig) {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
        config.setHostName(properties.getStandalone().getHost());
        config.setPort(properties.getStandalone().getPort());
        config.setDatabase(properties.getStandalone().getDatabase());
        
        if (properties.getStandalone().getPassword() != null && !properties.getStandalone().getPassword().isEmpty()) {
            config.setPassword(properties.getStandalone().getPassword());
        }
        
        LettuceConnectionFactory factory = new LettuceConnectionFactory(config, clientConfig);
        factory.setValidateConnection(true);
        
        log.info("Standalone Redis connection configured ({}:{})", 
                properties.getStandalone().getHost(), 
                properties.getStandalone().getPort());
        
        return factory;
    }
    
    /**
     * Create Lettuce client configuration with pooling
     */
    private LettuceClientConfiguration createClientConfiguration() {
        SocketOptions socketOptions = SocketOptions.builder()
                .connectTimeout(properties.getTimeout().getConnect())
                .build();

        TimeoutOptions timeoutOptions = TimeoutOptions.builder()
                .fixedTimeout(properties.getTimeout().getCommand())
                .build();
        
        ClientOptions clientOptions = ClientOptions.builder()
                .socketOptions(socketOptions)
                .timeoutOptions(timeoutOptions)
                .build();
        
        LettucePoolingClientConfiguration.LettucePoolingClientConfigurationBuilder poolBuilder =
                LettucePoolingClientConfiguration.builder()
                        .poolConfig(createPoolConfig())
                        .clientOptions(clientOptions);
        
        return poolBuilder.build();
    }
    
    /**
     * Create connection pool configuration
     */
    private org.apache.commons.pool2.impl.GenericObjectPoolConfig<?> createPoolConfig() {
        org.apache.commons.pool2.impl.GenericObjectPoolConfig<?> poolConfig = 
                new org.apache.commons.pool2.impl.GenericObjectPoolConfig<>();
        
        poolConfig.setMaxTotal(properties.getPool().getMaxActive());
        poolConfig.setMaxIdle(properties.getPool().getMaxIdle());
        poolConfig.setMinIdle(properties.getPool().getMinIdle());
        poolConfig.setMaxWaitMillis(properties.getPool().getMaxWait().toMillis());
        poolConfig.setTestOnBorrow(properties.getPool().isTestOnBorrow());
        poolConfig.setTestOnReturn(properties.getPool().isTestOnReturn());
        poolConfig.setTestWhileIdle(properties.getPool().isTestWhileIdle());
        poolConfig.setTimeBetweenEvictionRunsMillis(
                properties.getPool().getTimeBetweenEvictionRuns().toMillis());
        
        return poolConfig;
    }
    
    /**
     * Create JSON value serializer with proper ObjectMapper configuration
     */
    private RedisSerializer<Object> createValueSerializer() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.activateDefaultTyping(
                objectMapper.getPolymorphicTypeValidator(),
                ObjectMapper.DefaultTyping.NON_FINAL
        );
        
        return new GenericJackson2JsonRedisSerializer(objectMapper);
    }
}

