NAME          = ft_transcendance
COMPOSE       = docker compose
COMPOSE_FILE  = docker-compose.yml

WEBAPP_DIR    = webapp
AUTH_DIR      = server/services/auth

SCRIPT        = ./setup.sh

SHELL := /bin/bash

ELK_EXPORT_SCRIPT=./ELK/kibana/scripts/export_shared_objects.sh
ELK_IMPORT_SCRIPT=./ELK/kibana/scripts/import_shared_objects.sh

# =================== RÈGLES ===================

all: 
	$(COMPOSE) -p $(NAME) -f $(COMPOSE_FILE) up --build -d
	@$(MAKE) wait-kibana
	@$(MAKE) elk-import



down:
	$(COMPOSE) -f $(COMPOSE_FILE) down


logs:
	$(COMPOSE) -f $(COMPOSE_FILE) logs -f

ps:
	$(COMPOSE) -f $(COMPOSE_FILE) ps


clean:
	docker compose -p $(NAME) down

vclean:
	docker compose -p $(NAME) down -v

fclean-hard:
	docker compose down
	docker system prune -a -f --volumes
	docker network prune -f
	docker network rm $$(docker network ls -q) 2>/dev/null || true
	docker volume rm $$(docker volume ls -qf dangling=true) 2>/dev/null || true

fclean:
	docker compose -p $(NAME) down --remove-orphans
	docker container prune -f
	docker image prune -af


# network:
# 	docker network inspect transcendance_net >/dev/null 2>&1 || \
# 	docker network create transcendance_net


# =================== SCRIPTS & NPM ===================

script:
	@if [ -x "$(SCRIPT)" ]; then \
		echo "▶ Exécution du script: $(SCRIPT)"; \
		"$(SCRIPT)"; \
	else \
		echo "ℹ Aucun script exécutable trouvé à $(SCRIPT) (skip)"; \
	fi

npm-clean:
	@echo "Suppression node_modules …"
	@sudo rm -rf "$(WEBAPP_DIR)/node_modules" || true
	@sudo rm -rf "$(AUTH_DIR)/node_modules" || true
	@echo "OK."


wait-kibana:
	@./ELK/kibana/scripts/wait_kibana.sh


elk-import:
	@bash $(ELK_IMPORT_SCRIPT)

elk-export:
	@bash $(ELK_EXPORT_SCRIPT)


.PHONY: all up down restart logs ps clean vclean fclean fclean-hard re script npm-clean npm-install npm-install-docker wait_kibana elk-import elk-export network