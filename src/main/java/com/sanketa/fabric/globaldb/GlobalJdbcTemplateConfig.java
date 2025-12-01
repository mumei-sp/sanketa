package com.sanketa.fabric.globaldb;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

/**
 * Dedicated configuration for the Global DB {@link JdbcTemplate}.
 */
@Configuration
public class GlobalJdbcTemplateConfig {

    @Bean
    @Qualifier("globalJdbcTemplate")
    public JdbcTemplate globalJdbcTemplate(@Qualifier("globalDataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }
}
