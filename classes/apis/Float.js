const { config } = require("dotenv");
config();

/**
 * The Float class lets you interact with the Float API.
 */
class Float {
  constructor() {
    this.baseUrl = "https://api.float.com/v3";
    this.apiKey = process.env.FLOAT_API_KEY;
    this.defaultHeaders = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
  }

  async getBudgetInfo(projectId) {
    const fields = [
      "id",
      "name",
      "budget_type",
      "budget_total",
      "budget_priority",
    ];

    const queryParams = new URLSearchParams({
      project_id: projectId,
      fields: fields.join(","),
    });

    const url = `${this.baseUrl}/projects?${queryParams.toString()}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.defaultHeaders,
      });
      return await response.json();
    } catch (error) {
      console.error("Failed to get budget info:", error);
      throw error;
    }
  }

  async getProjects() {
    const fields = ["project_id", "name", "project_manager"];

    const queryParams = new URLSearchParams({
      "per-page": 100,
      active: 1,
      nonBillable: 0,
      fields: fields.join(","),
      sort: "-modified",
    });

    const url = `${this.baseUrl}/projects?${queryParams.toString()}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.defaultHeaders,
      });
      return response.json();
    } catch (error) {
      console.error("Failed to get projects:", error);
      throw error;
    }
  }

  async getPeopleReport() {
    /**
     * The start and end dates are now hardcoded, it would be nice to make
     * these dynamic in the intention handler based on the user's question.
     */
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 7);

    const formattedStartDate = startDate.toISOString().split("T")[0];
    const formattedEndDate = endDate.toISOString().split("T")[0];

    const url = `${this.baseUrl}/reports/people?start_date=${formattedStartDate}&end_date=${formattedEndDate}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.defaultHeaders,
      });
      return response.json();
    } catch (error) {
      console.error("Failed to get people report:", error);
      throw error;
    }
  }

  async getPeople() {
    const url = `${this.baseUrl}/people`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.defaultHeaders,
      });
      return response.json();
    } catch (error) {
      console.error("Failed to get people:", error);
      throw error;
    }
  }

  async fetchTasksByPersonId(personId, startDate, endDate) {
    const today = new Date();
    today.setDate(today.getDate());

    const formatDate = (date) => date.toISOString().split("T")[0];
    const formattedDate = formatDate(today);

    if (!startDate) {
      startDate = formattedDate;
    }

    if (!endDate) {
      endDate = formattedDate;
    }

    const fields = [
      "id",
      "name",
      "hours",
      "project_id",
      "task_id",
      "start_date",
      "end_date",
    ];

    const queryParams = new URLSearchParams({
      people_id: personId,
      start_date: startDate,
      end_date: endDate,
      billable: 1,
      repeat_state: 0,
    });

    queryParams.set("fields", fields.join(","));

    const url = `${this.baseUrl}/tasks?${queryParams.toString()}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.defaultHeaders,
      });
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch tasks by person id:", error);
      throw error;
    }
  }

  async getProjectById(projectId) {
    const fields = ["name", "project_manager", "project_team"];

    const queryParams = new URLSearchParams({
      fields: fields.join(","),
      expand: "project_team",
    });

    const url = `${
      this.baseUrl
    }/projects/${projectId}?${queryParams.toString()}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.defaultHeaders,
      });
      return response.json();
    } catch (error) {
      console.error("Failed to get project by id:", error);
      throw error;
    }
  }

  async getTaskById(taskId) {
    const fields = ["name", "project_id", "tasklist_id"];

    const queryParams = new URLSearchParams({
      fields: fields.join(","),
    });

    const url = `${this.baseUrl}/tasks/${taskId}?${queryParams.toString()}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.defaultHeaders,
      });
      return response.json();
    } catch (error) {
      console.error("Failed to get task by id:", error);
      throw error;
    }
  }

  async getPeopleById(personId) {
    const fields = ["name", "email"];

    const queryParams = new URLSearchParams({
      fields: fields.join(","),
    });

    const url = `${this.baseUrl}/people/${personId}?${queryParams.toString()}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.defaultHeaders,
      });
      return response.json();
    } catch (error) {
      console.error("Failed to get people by id:", error);
      throw error;
    }
  }

  async getAccountById(personId) {
    const fields = ["name", "email"];

    const queryParams = new URLSearchParams({
      fields: fields.join(","),
    });

    const url = `${
      this.baseUrl
    }/accounts/${personId}?${queryParams.toString()}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.defaultHeaders,
      });
      return response.json();
    } catch (error) {
      console.error("Failed to get account by id:", error);
      throw error;
    }
  }
}

module.exports = new Float();
