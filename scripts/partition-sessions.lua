-- Активные сессии и их пользователи (ЛР-4).
-- Запуск: npm run redis:sessions
-- Для каждого ключа partition-session:<id> выводит логин, id пользователя
-- и оставшееся время жизни сессии в секундах (TTL)
local result = {}
local keys = redis.call('KEYS', 'partition-session:*')
table.insert(result, 'Активных сессий: ' .. #keys)
for _, key in ipairs(keys) do
  local login = redis.call('HGET', key, 'partitionUserLogin')
  local userId = redis.call('HGET', key, 'partitionUserId')
  local ttl = redis.call('TTL', key)
  table.insert(result, key .. ' -> ' .. login .. ' (id ' .. userId .. ', TTL ' .. ttl .. ' sec)')
end
return result
