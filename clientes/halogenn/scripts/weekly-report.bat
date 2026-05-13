@echo off
cd /d "C:\Users\User\Desktop\gestor-ads"
node clientes\halogenn\scripts\report-weekly.js >> C:\Users\User\Desktop\gestor-ads\clientes\halogenn\logs\weekly-report.log 2>&1
